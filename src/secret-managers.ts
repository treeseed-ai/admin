import {
	assertTreeseedGitHubActionsEncryptedSecretDeployment,
	buildTreeseedClientEncryptedEscrowEnvelope,
	summarizeTreeseedClientEncryptedEscrowStatus,
} from '@treeseed/sdk/secrets-capability';

type TreeseedClientEncryptedEscrowEnvelopeInput = Parameters<typeof buildTreeseedClientEncryptedEscrowEnvelope>[0];
type TreeseedGitHubActionsEncryptedSecretDeployment = ReturnType<typeof assertTreeseedGitHubActionsEncryptedSecretDeployment>;

export type TreeseedSecretScope = 'local' | 'staging' | 'prod';

export interface SecretBindingSummary {
  id: string;
  label: string;
  scope: TreeseedSecretScope;
  status: 'active' | 'missing' | 'error' | (string & {});
  metadata?: Record<string, unknown>;
}

export interface SecretResolution {
  resolved: boolean;
  ref: string;
  value?: string;
  diagnostics?: TreeseedSecretManagerDiagnostic[];
}

export interface SecretWriteInput {
  ref: string;
  value: string;
  scope: TreeseedSecretScope;
  metadata?: Record<string, unknown>;
}

export interface SecretWriteResult {
  ok: boolean;
  ref: string;
  diagnostics?: TreeseedSecretManagerDiagnostic[];
}

export interface TreeseedSecretManagerDiagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface TreeseedSecretManagerProvider {
  id: string;
  label: string;
  supportedScopes: TreeseedSecretScope[];
  capabilities: {
    write: boolean;
    rotate: boolean;
    import: boolean;
    audit: boolean;
  };
  listBindings(context: unknown): Promise<SecretBindingSummary[]>;
  resolveSecret(context: unknown, ref: string): Promise<SecretResolution>;
  writeSecret(context: unknown, input: SecretWriteInput): Promise<SecretWriteResult>;
  validateConnection(context: unknown): Promise<TreeseedSecretManagerDiagnostic[]>;
}

function unsupportedWrite(provider: Pick<TreeseedSecretManagerProvider, 'id'>, input: SecretWriteInput): SecretWriteResult {
  return {
    ok: false,
    ref: input.ref,
    diagnostics: [{
      code: 'secret_manager.unsupported_write',
      severity: 'error',
      message: `${provider.id} does not support direct secret writes from the admin UI.`,
    }],
  };
}

function provider(id: string, label: string, capabilities: TreeseedSecretManagerProvider['capabilities']): TreeseedSecretManagerProvider {
  return {
    id,
    label,
    supportedScopes: ['local', 'staging', 'prod'],
    capabilities,
    async listBindings() {
      return [];
    },
    async resolveSecret(_context, ref) {
      return { resolved: false, ref };
    },
    async writeSecret(_context, input) {
      return unsupportedWrite({ id }, input);
    },
    async validateConnection() {
      return [];
    },
  };
}

export const DEFAULT_SECRET_MANAGER_PROVIDERS: TreeseedSecretManagerProvider[] = [
  provider('treeseed-local-encrypted', 'Treeseed local encrypted payloads', { write: true, rotate: false, import: true, audit: false }),
  provider('treeseed-config', 'Treeseed machine config', { write: false, rotate: false, import: true, audit: false }),
  provider('github-actions', 'GitHub Actions secrets and variables', { write: true, rotate: true, import: true, audit: true }),
  provider('cloudflare', 'Cloudflare secrets and variables', { write: true, rotate: true, import: true, audit: true }),
  provider('railway', 'Railway variables', { write: true, rotate: true, import: true, audit: true }),
];

export function buildAdminClientEncryptedEscrowBody(
  input: TreeseedClientEncryptedEscrowEnvelopeInput & {
    name?: string;
    secretClass?: string;
    secretMetadata?: Record<string, unknown>;
  },
) {
  const envelope = buildTreeseedClientEncryptedEscrowEnvelope(input);
  return {
    ...envelope,
    name: input.name,
    secretClass: input.secretClass,
    secretMetadata: input.secretMetadata,
    recoveryPolicy: 'reentry_required',
  };
}

export function describeAdminClientEncryptedEscrowStatus(record: TreeseedClientEncryptedEscrowEnvelopeInput, now = new Date()) {
  const summary = summarizeTreeseedClientEncryptedEscrowStatus(record, now);
  return {
    ...summary,
    label: summary.reentryRequired
      ? 're-entry required'
      : summary.migrated
        ? 'migrated'
        : summary.tombstoned
          ? 'tombstoned'
          : 'escrowed',
  };
}

export function buildAdminGitHubActionsSecretDeploymentBody(input: TreeseedGitHubActionsEncryptedSecretDeployment & Record<string, unknown>) {
  return {
    ...assertTreeseedGitHubActionsEncryptedSecretDeployment(input),
    custodyMode: 'github_actions_secret_enclave',
  };
}

export function describeAdminSecretCapabilityState(
  input: Partial<TreeseedClientEncryptedEscrowEnvelopeInput> & {
    custodyMode?: string | null;
    githubSecretTarget?: Record<string, unknown> | null;
    providerOwned?: boolean | null;
    bootstrap?: boolean | null;
    hostInjected?: boolean | null;
    metadataOnly?: boolean | null;
    failClosedCode?: string | null;
    driftCode?: string | null;
  },
  now = new Date(),
) {
  const custodyMode = input.custodyMode ?? (
    input.bootstrap ? 'bootstrap_service_secret'
      : input.providerOwned ? 'provider_owned_secret'
        : input.hostInjected ? 'host_env_injection'
          : input.metadataOnly ? 'metadata_only_reentry'
            : input.githubSecretTarget ? 'github_actions_secret_enclave'
              : input.ciphertextRef || input.ciphertext ? 'client_encrypted_escrow'
                : 'metadata_only_reentry'
  );
  const escrow = custodyMode === 'client_encrypted_escrow'
    ? describeAdminClientEncryptedEscrowStatus(input as TreeseedClientEncryptedEscrowEnvelopeInput, now)
    : null;
  const label = escrow?.label
    ?? (custodyMode === 'github_actions_secret_enclave' ? 'GitHub-backed'
      : custodyMode === 'host_env_injection' ? 'host-injected'
        : custodyMode === 'bootstrap_service_secret' ? 'bootstrap'
          : custodyMode === 'provider_owned_secret' ? 'provider-owned'
            : 'metadata-only');
  return {
    custodyMode,
    label,
    escrowed: escrow?.escrowed ?? false,
    githubBacked: custodyMode === 'github_actions_secret_enclave',
    hostInjected: custodyMode === 'host_env_injection',
    metadataOnly: custodyMode === 'metadata_only_reentry',
    bootstrap: custodyMode === 'bootstrap_service_secret',
    providerOwned: custodyMode === 'provider_owned_secret',
    migrated: escrow?.migrated ?? false,
    expired: escrow?.expired ?? false,
    tombstoned: escrow?.tombstoned ?? false,
    reentryRequired: escrow?.reentryRequired ?? false,
    warnings: [
      ...(custodyMode === 'host_env_injection' ? ['Host env injection exposes runtime secrets to the selected host.'] : []),
      ...(custodyMode === 'bootstrap_service_secret' ? ['Bootstrap secrets are high-risk operational secrets.'] : []),
      ...(input.failClosedCode || input.driftCode ? [`Secret capability is fail-closed: ${input.failClosedCode ?? input.driftCode}.`] : []),
      ...(escrow?.reentryRequired ? ['Re-enter this secret before migration or deployment.'] : []),
    ],
  };
}

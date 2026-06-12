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

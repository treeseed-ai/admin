import type {
	EncryptedCredentialEnvelope,
	EncryptedPrivateKeyEnvelope,
	TeamVaultGrantEnvelope,
} from '@treeseed/sdk/secrets-capability';

function unavailable(): never {
	throw new Error('Encrypted service-vault operations are unavailable in this Admin foundation release.');
}

export async function createServiceVaultKey(): Promise<Uint8Array> { return unavailable() }
export async function createServiceVaultUserKeyPair(): Promise<{ publicKey: string; privateKey: Uint8Array }> { return unavailable() }
export async function encryptServiceVaultPrivateKey(
	_privateKey: Uint8Array, _publicKey: string, _passphrase: string,
	_options: { opsLimit?: number; memLimit?: number } = {},
): Promise<EncryptedPrivateKeyEnvelope> { return unavailable() }
export async function decryptServiceVaultPrivateKey(
	_envelope: EncryptedPrivateKeyEnvelope, _passphrase: string,
): Promise<Uint8Array> { return unavailable() }
export async function createTeamVaultGrant(
	_teamVaultKey: Uint8Array, _recipientPublicKey: string,
): Promise<TeamVaultGrantEnvelope> { return unavailable() }
export async function openTeamVaultGrant(
	_grant: TeamVaultGrantEnvelope, _recipientPrivateKey: Uint8Array,
): Promise<Uint8Array> { return unavailable() }
export async function encryptServiceCredential(
	_plaintext: string, _teamVaultKey: Uint8Array, _associatedData: string,
): Promise<EncryptedCredentialEnvelope> { return unavailable() }
export async function decryptServiceCredential(
	_envelope: EncryptedCredentialEnvelope, _teamVaultKey: Uint8Array, _expectedAssociatedData: string,
): Promise<string> { return unavailable() }
export async function rewrapServiceCredential(
	_envelope: EncryptedCredentialEnvelope, _currentTeamVaultKey: Uint8Array, _replacementTeamVaultKey: Uint8Array,
): Promise<EncryptedCredentialEnvelope> { return unavailable() }
export async function sealSecretOperationPayload(
	_values: Record<string, string>, _operationPublicKey: string,
): Promise<string> { return unavailable() }
export async function encryptGitHubActionsSecret(
	_value: string, _providerPublicKey: string,
): Promise<string> { return unavailable() }
export async function openSecretOperationPayload(
	_sealedPayload: string, _operationPublicKey: string, _operationPrivateKey: Uint8Array,
): Promise<Record<string, string>> { return unavailable() }
export function clearServiceVaultKey(value: Uint8Array | undefined): void { value?.fill(0) }

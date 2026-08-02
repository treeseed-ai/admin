import {
	SERVICE_VAULT_ENCRYPTION_VERSION,
	canonicalServiceVaultAssociatedData,
	clearServiceVaultKey,
	createServiceVaultKey,
	createServiceVaultUserKeyPair,
	createTeamVaultGrant,
	decryptServiceCredential,
	decryptServiceVaultPrivateKey,
	encryptServiceCredential,
	encryptServiceVaultPrivateKey,
	openTeamVaultGrant,
	rewrapServiceCredential,
	sealSecretOperationPayload,
} from '@treeseed/sdk/secrets-capability';
import { registerFormAdapter, sendFormRequest } from '@treeseed/ui/forms/client';

function jsonRequest(url: string, body: unknown, csrfToken: string, method = 'POST') {
	return {
		url,
		init: {
			method,
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				'x-treeseed-csrf': csrfToken,
				'x-treeseed-form': 'enhanced',
			},
			body: JSON.stringify(body),
			credentials: 'same-origin' as const,
		},
	};
}

function text(data: FormData, key: string) {
	return String(data.get(key) ?? '').trim();
}

export function registerServiceFormAdapters() {
	const disposers = [
		registerFormAdapter('provider-authority', {
			buildRequest(context) {
				const body: Record<string, unknown> = {
					scheme: text(context.formData, 'scheme'), reference: text(context.formData, 'reference'),
				};
				const version = text(context.formData, 'version');
				if (version) body.version = Number(version);
				return jsonRequest(context.form.action, body, text(context.formData, 'csrfToken'), 'PUT');
			},
		}),
		registerFormAdapter('github-connector', {
			buildRequest(context) {
				return jsonRequest(context.form.action, {
					teamId: text(context.formData, 'teamId'),
					connectionId: text(context.formData, 'connectionId'),
				}, text(context.formData, 'csrfToken'));
			},
			afterSuccess(result) {
				const redirect = (result.payload as { redirect?: string } | undefined)?.redirect;
				if (redirect) window.location.assign(redirect);
			},
		}),
		registerFormAdapter('service-connection', {
			buildRequest(context) {
				const capabilities = context.formData.getAll('capabilities').map(String);
				const config = Object.fromEntries(
					[...context.formData.entries()]
						.filter(([key]) => key.startsWith('config.'))
						.map(([key, value]) => [key.slice('config.'.length), String(value).trim()]),
				);
				const body: Record<string, unknown> = {
					providerId: text(context.formData, 'providerId'),
					displayName: text(context.formData, 'displayName'),
					nonSecretConfig: config,
					capabilities: capabilities.map((capabilityType) => ({ capabilityType, status: 'configured',
						credentialProfileId: text(context.formData, `capabilityProfile.${capabilityType}`) || undefined })),
				};
				const version = text(context.formData, 'version');
				if (version) body.version = Number(version);
				return jsonRequest(context.form.action, body, text(context.formData, 'csrfToken'), context.form.dataset.tsMethod || 'POST');
			},
		}),
		registerFormAdapter('personal-vault-key', {
			async buildRequest(context) {
				const passphrase = text(context.formData, 'passphrase');
				const pair = await createServiceVaultUserKeyPair();
				try {
					const encryptedPrivateKeyEnvelope = await encryptServiceVaultPrivateKey(pair.privateKey, pair.publicKey, passphrase);
					const request = jsonRequest(context.form.action, {
						publicKey: pair.publicKey,
						encryptedPrivateKeyEnvelope,
					}, text(context.formData, 'csrfToken'));
					request.init.method = 'PUT';
					return request;
				} finally {
					clearServiceVaultKey(pair.privateKey);
				}
			},
		}),
		registerFormAdapter('personal-vault-rotate', {
			async buildRequest(context) {
				const existing = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(existing, text(context.formData, 'currentPassphrase'));
				try {
					const encryptedPrivateKeyEnvelope = await encryptServiceVaultPrivateKey(
						privateKey,
						existing.publicKey,
						text(context.formData, 'passphrase'),
					);
					return jsonRequest(context.form.action, {
						publicKey: existing.publicKey,
						encryptedPrivateKeyEnvelope,
					}, text(context.formData, 'csrfToken'), 'PUT');
				} finally {
					clearServiceVaultKey(privateKey);
				}
			},
		}),
		registerFormAdapter('team-vault-initialize', {
			async buildRequest(context) {
				const encryptedPrivateKeyEnvelope = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(encryptedPrivateKeyEnvelope, text(context.formData, 'passphrase'));
				const teamVaultKey = await createServiceVaultKey();
				try {
					const grant = await createTeamVaultGrant(teamVaultKey, encryptedPrivateKeyEnvelope.publicKey);
					return jsonRequest(context.form.action, {
						userVaultKeyId: text(context.formData, 'userVaultKeyId'),
						wrappedTeamVaultKey: grant.wrappedTeamVaultKey,
						encryptionVersion: SERVICE_VAULT_ENCRYPTION_VERSION,
					}, text(context.formData, 'csrfToken'));
				} finally {
					clearServiceVaultKey(privateKey);
					clearServiceVaultKey(teamVaultKey);
				}
			},
		}),
		registerFormAdapter('team-vault-reset', {
			async buildRequest(context) {
				const encryptedPrivateKeyEnvelope = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(encryptedPrivateKeyEnvelope, text(context.formData, 'passphrase'));
				const teamVaultKey = await createServiceVaultKey();
				try {
					const grant = await createTeamVaultGrant(teamVaultKey, encryptedPrivateKeyEnvelope.publicKey);
					return jsonRequest(context.form.action, {
						userVaultKeyId: text(context.formData, 'userVaultKeyId'),
						wrappedTeamVaultKey: grant.wrappedTeamVaultKey,
						encryptionVersion: SERVICE_VAULT_ENCRYPTION_VERSION,
						confirmation: text(context.formData, 'confirmation'),
						currentPassword: String(context.formData.get('currentPassword') ?? ''),
					}, text(context.formData, 'csrfToken'));
				} finally {
					clearServiceVaultKey(privateKey);
					clearServiceVaultKey(teamVaultKey);
				}
			},
		}),
		registerFormAdapter('team-vault-rotate', {
			async buildRequest(context) {
				const privateEnvelope = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(privateEnvelope, text(context.formData, 'passphrase'));
				const currentTeamKey = await openTeamVaultGrant({
					version: SERVICE_VAULT_ENCRYPTION_VERSION,
					algorithm: 'x25519-sealed-box',
					recipientPublicKey: privateEnvelope.publicKey,
					wrappedTeamVaultKey: text(context.formData, 'wrappedTeamVaultKey'),
				}, privateKey);
				const replacementTeamKey = await createServiceVaultKey();
				try {
					const envelopes = JSON.parse(text(context.formData, 'envelopes')) as Array<{ id: string; envelope: any }>;
					const grants = JSON.parse(text(context.formData, 'grants')) as Array<{ userId: string; userVaultKeyId: string; publicKey: string }>;
					const replacements = await Promise.all(envelopes.map(async (item) => ({
						id: item.id,
						envelope: await rewrapServiceCredential(item.envelope, currentTeamKey, replacementTeamKey),
					})));
					const replacementGrants = await Promise.all(grants.map(async (grant) => ({
						userId: grant.userId,
						userVaultKeyId: grant.userVaultKeyId,
						wrappedTeamVaultKey: (await createTeamVaultGrant(replacementTeamKey, grant.publicKey)).wrappedTeamVaultKey,
					})));
					return jsonRequest(context.form.action, {
						expectedKeyVersion: Number(text(context.formData, 'expectedKeyVersion')),
						envelopes: replacements,
						grants: replacementGrants,
					}, text(context.formData, 'csrfToken'));
				} finally {
					clearServiceVaultKey(privateKey);
					clearServiceVaultKey(currentTeamKey);
					clearServiceVaultKey(replacementTeamKey);
				}
			},
		}),
		registerFormAdapter('team-vault-grant', {
			async buildRequest(context) {
				const encryptedPrivateKeyEnvelope = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(encryptedPrivateKeyEnvelope, text(context.formData, 'passphrase'));
				const ownGrant = {
					version: SERVICE_VAULT_ENCRYPTION_VERSION,
					algorithm: 'x25519-sealed-box' as const,
					recipientPublicKey: encryptedPrivateKeyEnvelope.publicKey,
					wrappedTeamVaultKey: text(context.formData, 'wrappedTeamVaultKey'),
				};
				const teamVaultKey = await openTeamVaultGrant(ownGrant, privateKey);
				try {
					const recipient = await createTeamVaultGrant(teamVaultKey, text(context.formData, 'recipientPublicKey'));
					return jsonRequest(context.form.action, {
						userId: text(context.formData, 'userId'),
						userVaultKeyId: text(context.formData, 'userVaultKeyId'),
						wrappedTeamVaultKey: recipient.wrappedTeamVaultKey,
					}, text(context.formData, 'csrfToken'));
				} finally {
					clearServiceVaultKey(privateKey);
					clearServiceVaultKey(teamVaultKey);
				}
			},
		}),
		registerFormAdapter('service-credential', {
			async buildRequest(context) {
				const encryptedPrivateKeyEnvelope = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(encryptedPrivateKeyEnvelope, text(context.formData, 'passphrase'));
				const grant = {
					version: SERVICE_VAULT_ENCRYPTION_VERSION,
					algorithm: 'x25519-sealed-box' as const,
					recipientPublicKey: encryptedPrivateKeyEnvelope.publicKey,
					wrappedTeamVaultKey: text(context.formData, 'wrappedTeamVaultKey'),
				};
				const teamVaultKey = await openTeamVaultGrant(grant, privateKey);
				try {
					const definitionId = text(context.formData, 'definitionId');
					const fieldKey = text(context.formData, 'fieldKey');
					const keyVersion = Number(text(context.formData, 'keyVersion'));
					const associatedData = canonicalServiceVaultAssociatedData({
						teamId: text(context.formData, 'teamId'),
						connectionId: text(context.formData, 'connectionId'),
						credentialProfileId: definitionId,
						field: fieldKey,
						purpose: 'team-service-credential',
						version: keyVersion,
					});
					const envelope = await encryptServiceCredential(
						String(context.formData.get('credentialValue') ?? ''),
						teamVaultKey,
						associatedData,
					);
					return jsonRequest(context.form.action, {
						definitionId,
						fieldKey,
						keyVersion,
						envelope,
					}, text(context.formData, 'csrfToken'));
				} finally {
					clearServiceVaultKey(privateKey);
					clearServiceVaultKey(teamVaultKey);
				}
			},
		}),
		registerFormAdapter('service-validation', {
			buildRequest(context) {
				return jsonRequest(context.form.action, {
					connectionId: text(context.formData, 'connectionId'),
					capabilityType: text(context.formData, 'capabilityType'),
					credentialProfileId: text(context.formData, 'credentialProfileId'),
					purpose: text(context.formData, 'purpose'),
					idempotencyKey: text(context.formData, 'idempotencyKey'),
				}, text(context.formData, 'csrfToken'));
			},
			async afterSuccess(result, context) {
				const lease = result.payload as { id: string; publicKey?: string };
				const teamId = text(context.formData, 'teamId');
				const privateEnvelope = JSON.parse(text(context.formData, 'encryptedPrivateKeyEnvelope'));
				const privateKey = await decryptServiceVaultPrivateKey(privateEnvelope, text(context.formData, 'passphrase'));
				const teamVaultKey = await openTeamVaultGrant({
					version: SERVICE_VAULT_ENCRYPTION_VERSION,
					algorithm: 'x25519-sealed-box',
					recipientPublicKey: privateEnvelope.publicKey,
					wrappedTeamVaultKey: text(context.formData, 'wrappedTeamVaultKey'),
				}, privateKey);
				try {
					let current = lease;
					for (let attempt = 0; attempt < 30 && !current.publicKey; attempt += 1) {
						await new Promise((resolve) => window.setTimeout(resolve, 500));
						const response = await sendFormRequest({
							url: `/v1/teams/${encodeURIComponent(teamId)}/service-operation-leases/${encodeURIComponent(lease.id)}`,
							init: { headers: { accept: 'application/json' }, credentials: 'same-origin' },
						});
						const body = await response.json();
						if (!response.ok || !body.ok) throw new Error(body.message ?? 'The operations runner did not accept the lease.');
						current = body.payload;
					}
					if (!current.publicKey) throw new Error('The operations runner did not issue an ephemeral key before the lease expired.');
					const envelopes = JSON.parse(text(context.formData, 'envelopes')) as Array<{ fieldKey: string; envelope: any }>;
					const values = Object.fromEntries(await Promise.all(envelopes.map(async (item) => [
						item.fieldKey,
						await decryptServiceCredential(item.envelope, teamVaultKey, item.envelope.associatedData),
					])));
					const sealedPayload = await sealSecretOperationPayload(values, current.publicKey);
					const delivered = await sendFormRequest(jsonRequest(
						`/v1/teams/${encodeURIComponent(teamId)}/service-operation-leases/${encodeURIComponent(lease.id)}/payload`,
						{ sealedPayload },
						text(context.formData, 'csrfToken'),
						'PUT',
					));
					const deliveredBody = await delivered.json();
					if (!delivered.ok || !deliveredBody.ok) throw new Error(deliveredBody.message ?? 'The sealed validation payload was rejected.');
					result.message = 'Read-only provider validation authorized. The result will appear in connection activity.';
				} finally {
					clearServiceVaultKey(privateKey);
					clearServiceVaultKey(teamVaultKey);
				}
			},
		}),
		registerFormAdapter('external-vault-binding', {
			buildRequest(context) {
				return jsonRequest(context.form.action, {
					provider: 'openbao',
					authMode: text(context.formData, 'authMode'),
					reference: {
						address: text(context.formData, 'address'),
						mount: text(context.formData, 'mount'),
						role: text(context.formData, 'role'),
					},
				}, text(context.formData, 'csrfToken'));
			},
		}),
	];
	return () => disposers.forEach((dispose) => dispose());
}

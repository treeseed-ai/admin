import { encryptGitHubActionsSecret } from '../services/service-vault-crypto.ts';
import { registerFormAdapter } from '@treeseed/ui/forms/client';

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim();
const lines = (data: FormData, key: string) => text(data, key).split(/\r?\n/u).map((item) => item.trim()).filter(Boolean);
const headers = (csrf: string, idempotencyKey = crypto.randomUUID()) => ({ accept: 'application/json', 'content-type': 'application/json',
	'x-treeseed-csrf': csrf, 'x-treeseed-form': 'enhanced', 'idempotency-key': idempotencyKey });

function configuredUrl(form: HTMLFormElement, data: FormData, name?: string) {
	const url = new URL(name ? `${form.action}/${encodeURIComponent(name)}` : form.action, window.location.origin);
	url.searchParams.set('repositoryBindingId', text(data, 'repositoryBindingId'));
	url.searchParams.set('workflowBindingId', text(data, 'workflowBindingId'));
	url.searchParams.set('scope', 'repository');
	return url.toString();
}

export function registerWorkflowFormAdapters() {
	return [
		registerFormAdapter('workflow-operation', { buildRequest(context) {
			const requirements = (key: string) => lines(context.formData, key).map((name) => ({ name, scope: 'repository', required: true }));
			return { url: context.form.action, init: { method: 'PUT', credentials: 'same-origin', headers: headers(text(context.formData, 'csrfToken')),
				body: JSON.stringify({ repositoryBindingId: text(context.formData, 'repositoryBindingId'), workflowBindingId: text(context.formData, 'workflowBindingId'),
					workflowId: text(context.formData, 'workflowId'), refPolicy: lines(context.formData, 'refs'), allowedInputs: {},
					requiredSecrets: requirements('secrets'), requiredVariables: requirements('variables'), actorPolicy: ['user', 'capacity_provider'],
					modePolicy: ['operator', 'acting'], version: Number(text(context.formData, 'version') || 1) }) } };
		} }),
		registerFormAdapter('workflow-dispatch', { buildRequest(context) {
			const inputs = Object.fromEntries([...context.formData.entries()]
				.filter(([name]) => name.startsWith('input.'))
				.map(([name, value]) => [name.slice('input.'.length), String(value)]));
			const idempotencyKey = crypto.randomUUID();
			return { url: context.form.action, init: { method: 'POST', credentials: 'same-origin',
				headers: headers(text(context.formData, 'csrfToken'), idempotencyKey), body: JSON.stringify({
					ref: text(context.formData, 'ref'), sourceSha: text(context.formData, 'sourceSha'), inputs, idempotencyKey,
				}) } };
		} }),
		registerFormAdapter('workflow-secret', { async buildRequest(context) {
			const base = configuredUrl(context.form, context.formData);
			const keyResponse = await fetch(`${base}/public-key`, { credentials: 'same-origin', headers: { accept: 'application/json' } });
			if (!keyResponse.ok) throw new Error('GitHub secret encryption is unavailable.');
			const key = (await keyResponse.json()).payload;
			const encryptedValue = await encryptGitHubActionsSecret(text(context.formData, 'value'), key.publicKey);
			return { url: configuredUrl(context.form, context.formData, text(context.formData, 'name')), init: { method: 'PUT', credentials: 'same-origin',
				headers: headers(text(context.formData, 'csrfToken')), body: JSON.stringify({ encryptedValue, keyId: key.keyId,
					idempotencyKey: crypto.randomUUID() }) } };
		} }),
		registerFormAdapter('workflow-variable', { buildRequest(context) {
			return { url: configuredUrl(context.form, context.formData, text(context.formData, 'name')), init: { method: 'PUT', credentials: 'same-origin',
				headers: headers(text(context.formData, 'csrfToken')), body: JSON.stringify({ value: text(context.formData, 'value'),
					idempotencyKey: crypto.randomUUID() }) } };
		} }),
	];
}

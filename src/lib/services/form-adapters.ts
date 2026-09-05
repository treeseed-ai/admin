import { registerFormAdapter } from '@treeseed/ui/forms/client';
function jsonRequest(url: string, body: unknown, csrfToken: string, method = 'POST', ifMatch?: string) {
  return {url, init: {method, headers: {accept: 'application/json', 'content-type': 'application/json',
    'x-treeseed-csrf': csrfToken, 'x-treeseed-form': 'enhanced', 'Idempotency-Key': crypto.randomUUID(),
    ...(ifMatch === undefined ? {} : {'If-Match': ifMatch})},
    body: JSON.stringify(body), credentials: 'same-origin' as const}};
}
function text(data: FormData, key: string) { return String(data.get(key) ?? '').trim(); }
function connectionRevision(data: FormData) {
  const revision = text(data, 'version');
  if (!/^\d+$/.test(revision) || !Number.isSafeInteger(Number(revision))) throw new Error('Reload this connection before saving; its revision is missing or invalid.');
  return revision;
}
export function registerServiceFormAdapters() {
  const disposers = [
    registerFormAdapter('service-disconnect', {
      buildRequest(context) { return jsonRequest(context.form.action, {}, text(context.formData, 'csrfToken'), 'DELETE', connectionRevision(context.formData)); },
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
				const capabilities = [...new Set(context.formData.getAll('capabilities').map(String))];
				if (text(context.formData, 'combinedWorkflowEnvironment') === 'true' && capabilities.includes('workflow-configuration')) capabilities.push('secret-enclave');
				const githubMethod = text(context.formData, 'githubAuthMethod');
				if (text(context.formData, 'providerId') === 'github' && !['app', 'token'].includes(githubMethod)) throw new Error('Choose how to connect to GitHub.');
				if (!capabilities.length) throw new Error('Choose at least one task for this connection.');
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
						credentialProfileId: text(context.formData, 'providerId') === 'github'
							? `github-${capabilityType === 'repository-hosting' ? 'repository' : 'workflow'}-${githubMethod}`
							: text(context.formData, `capabilityProfile.${capabilityType}`) || undefined })),
				};
				const version = text(context.formData, 'version');
				if (version) body.version = Number(version);
				const method = context.form.dataset.tsMethod || 'POST';
				return jsonRequest(context.form.action, body, text(context.formData, 'csrfToken'), method, method === 'PUT' ? connectionRevision(context.formData) : undefined);
			},
			async parseResponse(response, context) {
				const body = await response.json().catch(() => null);
				const payload = body?.data ?? body?.payload ?? body;
				const ok = response.ok && body !== null && body?.ok !== false;
				const creating = !context.form.dataset.tsMethod;
				return {ok, code: ok ? 'saved' : 'save_failed',
					message: ok ? 'Settings saved.' : String(body?.detail ?? body?.error?.message ?? body?.message ?? 'Could not save this connection.'),
					fieldErrors: body?.fieldErrors,
					redirect: ok && creating ? (typeof payload?.id === 'string' ? '/app/services/' + encodeURIComponent(payload.id) : '/app/services') : undefined};
			},
		}),

    registerFormAdapter('managed-credentials', {
      buildRequest(context) {
        const method = context.form.dataset.tsMethod || 'PUT';
        const body: Record<string, unknown> = {expectedVersion: Number(text(context.formData, 'expectedVersion'))};
        if (method === 'PUT') body.values = Object.fromEntries([...context.formData.entries()]
          .filter(([key,value]) => key.startsWith('secret.') && String(value).length > 0)
          .map(([key,value]) => [key.slice(7),String(value)]));
        const request = jsonRequest(context.form.action,body,text(context.formData,'csrfToken'),method);
        context.form.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach(input => {input.value = '';});
        return request;
      },
    }),
  ];
  return () => disposers.forEach(dispose => dispose());
}

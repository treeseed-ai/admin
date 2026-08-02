import { registerFormAdapter } from '@treeseed/ui/forms/client';

const value = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

export function registerRepositoryFormAdapters() {
	return registerFormAdapter('repository-topology', {
		buildRequest(context) {
			const topology = JSON.parse(value(context.formData, 'topology'));
			const [serviceConnectionId, capabilityBindingId, authorityId, authorityStatus] = value(context.formData, 'authority').split('|');
			if (!serviceConnectionId || !capabilityBindingId || !authorityId) throw new Error('Choose a repository credential authority.');
			const owner = value(context.formData, 'owner');
			const name = value(context.formData, 'name');
			topology.contentRepository.remote = {
				bindingId: value(context.formData, 'bindingId') || crypto.randomUUID(), serviceConnectionId,
				capabilityBindingId, providerId: 'github', providerRepositoryId: 'provider-read-back-required', owner, name,
				cloneUrl: `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}.git`,
				defaultRef: value(context.formData, 'defaultRef'), publicationRef: value(context.formData, 'publicationRef'),
				authorityId, expectedHead: null, observedHead: null,
				grantStatus: authorityStatus === 'ready' ? 'ready' : 'reauthorization-required', drift: 'unknown',
				version: Number(value(context.formData, 'version') || 1),
			};
			return { url: context.form.action, init: { method: 'PUT', credentials: 'same-origin',
				headers: { accept: 'application/json', 'content-type': 'application/json',
					'x-treeseed-csrf': value(context.formData, 'csrfToken'), 'x-treeseed-form': 'enhanced' },
				body: JSON.stringify(topology) } };
		},
	});
}

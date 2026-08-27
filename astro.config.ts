import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const tenantRoot = dirname(fileURLToPath(import.meta.url));
process.env.TREESEED_TENANT_ROOT = tenantRoot;
process.chdir(tenantRoot);

const { createTenantSite } = await import('@treeseed/core/config');
const site = createTenantSite();
const developmentWorkspaceRoot = process.env.TREESEED_DEVELOPMENT_WORKSPACE_ROOT?.trim();

export default {
	...site,
	devToolbar: { enabled: false },
	...(developmentWorkspaceRoot ? {
		vite: {
			...site.vite,
			server: {
				...site.vite?.server,
				fs: { ...site.vite?.server?.fs, allow: [...(site.vite?.server?.fs?.allow ?? []), developmentWorkspaceRoot] },
			},
		},
	} : {}),
	outDir: '.treeseed/app-dist',
};

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const tenantRoot = dirname(fileURLToPath(import.meta.url));
process.env.TREESEED_TENANT_ROOT = tenantRoot;
process.chdir(tenantRoot);

const { createTenantSite } = await import('@treeseed/core/config');

export default {
	...createTenantSite(),
	outDir: '.treeseed/app-dist',
};

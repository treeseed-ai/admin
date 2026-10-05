import { fileURLToPath } from 'node:url';

process.env.TREESEED_TENANT_ROOT ??= fileURLToPath(new URL('../', import.meta.url));

const { createTenantCollections } = await import('@treeseed/core/content-config');

export const collections = createTenantCollections();

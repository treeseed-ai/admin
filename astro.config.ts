import { dirname, resolve } from 'node:path';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sourceUpdates } from './scripts/development/source-updates';

const tenantRoot = dirname(fileURLToPath(import.meta.url));
process.env.TREESEED_TENANT_ROOT = tenantRoot;
process.chdir(tenantRoot);

const { createTenantSite } = await import('@treeseed/core/config');
const site = createTenantSite();
const developmentWorkspaceRoot = process.env.TREESEED_DEVELOPMENT_WORKSPACE_ROOT?.trim();
const aliases = site.vite?.resolve?.alias ?? [];
const existingAliases = Array.isArray(aliases) ? aliases : Object.entries(aliases).map(([find, replacement]) => ({find, replacement}));

export default {
	...site,
	devToolbar: { enabled: false },
	vite: {...site.vite, plugins: [...(site.vite?.plugins ?? []), sourceUpdates(false)]},
	...(developmentWorkspaceRoot ? {
		vite: {
			...site.vite,
			plugins: [...(site.vite?.plugins ?? []), sourceUpdates(process.env.TREESEED_DEVELOPMENT_MODE === 'live')],
			resolve: { ...site.vite?.resolve, preserveSymlinks: true, dedupe: [...(site.vite?.resolve?.dedupe ?? []), '@treeseed/ui'],
        alias: [{find: '@treeseed/ui/forms/client', replacement: realpathSync(resolve(tenantRoot, 'node_modules/@treeseed/ui/dist/forms-client.js'))}, ...existingAliases] },
			ssr: { ...site.vite?.ssr, noExternal: ['@treeseed/ui'] },
			server: {
				...site.vite?.server,
				allowedHosts: ['admin.treeseed.localhost'],
				fs: { ...site.vite?.server?.fs, allow: [...(site.vite?.server?.fs?.allow ?? []), developmentWorkspaceRoot] },
			},
		},
	} : {}),
	outDir: '.treeseed/app-dist',
};

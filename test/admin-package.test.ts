import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import adminPlugin, { ADMIN_CAPABILITIES, ADMIN_ENV_SCHEMA } from '../src/plugin';
import type { TreeseedPluginSiteContext, TreeseedSiteExtensionContribution } from '@treeseed/sdk/platform/plugin';
import { ADMIN_ROUTES, ADMIN_SUPPORT_ROUTES } from '../src/routes';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from '../src/commerce';
import { DEFAULT_SECRET_MANAGER_PROVIDERS } from '../src/secret-managers';

const EXPECTED_ROUTES = [
	'/app',
	'/app/account',
	'/app/account/sessions',
	'/app/account/notifications',
	'/app/account/appearance',
	'/app/account/delete',
	'/app/teams',
	'/app/teams/new',
	'/app/teams/[teamId]/edit',
	'/app/teams/[teamId]/delete',
	'/app/teams/[teamId]/members',
	'/auth/register',
	'/auth/check-email',
	'/auth/confirm-email',
	'/auth/sign-in',
	'/auth/logout',
	'/auth/forgot-password',
	'/auth/reset-password',
	'/auth/username',
	'/auth/device/approve',
	'/auth/callback/[provider]',
	'/u/[username]',
	'/t/[name]',
	'/team-invites/[token]/accept',
].sort();
const EXPECTED_SUPPORT_ROUTES = ['/v1/[...all]'];

function filesUnder(root: string): string[] {
	if (!existsSync(root)) return [];
	return readdirSync(root).flatMap((name) => {
		const path = join(root, name);
		return statSync(path).isDirectory()
			? filesUnder(path)
			: [relative(process.cwd(), path).replace(/\\/gu, '/')];
	});
}

function routePatternFromPage(path: string) {
	const normalized = path.replace(/^src\/pages/u, '').replace(/\.(astro|ts)$/u, '');
	return normalized.replace(/\/index$/u, '') || '/';
}

function exportTargets(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
	return Object.values(value as Record<string, unknown>).flatMap(exportTargets);
}

function resolveSiteHooks(): TreeseedSiteExtensionContribution {
	const hooks = adminPlugin.siteHooks;
	if (!hooks) return {};
	if (typeof hooks !== 'function') return hooks;
	return hooks({
		projectRoot: process.cwd(),
		tenantConfig: {} as TreeseedPluginSiteContext['tenantConfig'],
		pluginConfig: {},
	} satisfies TreeseedPluginSiteContext);
}

describe('@treeseed/admin identity and team surface', () => {
	it('registers exactly the retained routes and resources', () => {
		const pageFiles = filesUnder('src/pages').filter((path) => /\.(astro|ts)$/u.test(path));
		expect(ADMIN_ROUTES.map((route) => route.pattern).sort()).toEqual(EXPECTED_ROUTES);
		expect(ADMIN_SUPPORT_ROUTES.map((route) => route.pattern).sort()).toEqual(EXPECTED_SUPPORT_ROUTES);
		expect(pageFiles.map(routePatternFromPage).sort()).toEqual([...EXPECTED_ROUTES, ...EXPECTED_SUPPORT_ROUTES].sort());
		expect([...ADMIN_ROUTES, ...ADMIN_SUPPORT_ROUTES].map((route) => route.resourcePath).sort()).toEqual(
			pageFiles.map((path) => path.replace(/^src\//u, '')).sort(),
		);
	});

	it('keeps navigation limited to identity and team management', () => {
		const appLayout = readFileSync('src/layouts/TreeseedAppLayout.astro', 'utf8');
		for (const target of ['/app/', '/app/account', '/app/teams', '/app/teams/new']) {
			expect(appLayout).toContain(target);
		}
		for (const target of ['/app/projects', '/app/capacity', '/app/work', '/app/knowledge', '/market', '/cart', '/seller']) {
			const escaped = target.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
			expect(appLayout).not.toMatch(new RegExp(`(?:href|action)\\s*[:=]\\s*['"\\x60]${escaped}`, 'u'));
		}
	});

	it('uses public package boundaries and retained UI styles', () => {
		const sources = filesUnder('src')
			.filter((path) => /\.(astro|tsx?|jsx?|mjs|cjs)$/u.test(path))
			.map((path) => [path, readFileSync(path, 'utf8')] as const);
		expect(sources.some(([, source]) => source.includes('@treeseed/ui/'))).toBe(true);
		for (const [path, source] of sources) {
			expect(source, path).not.toMatch(/packages\/(?:ui|core|sdk|api)\/src/u);
			expect(source, path).not.toMatch(/(?:from|import)\s*['"](?:\.\.\/){3,}src\//u);
		}
		const css = resolveSiteHooks().customCss ?? [];
		expect(css).toContain('@treeseed/ui/styles/app-shell.css');
		expect(css).not.toContain('@treeseed/ui/styles/operations.css');
		expect(css).not.toContain('@treeseed/ui/styles/market.css');
		expect(ADMIN_CAPABILITIES.ecommerce.bundled).toBe(false);
		expect(Object.keys(ADMIN_ENV_SCHEMA)).toContain('TREESEED_BETTER_AUTH_SECRET');
	});

	it('retains domain facades without route-specific UI dependencies', () => {
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies?: Record<string, string> };
		expect(packageJson.dependencies).not.toHaveProperty('@mdxeditor/editor');
		expect(packageJson.dependencies).not.toHaveProperty('libsodium-wrappers-sumo');
		expect(packageJson.dependencies).not.toHaveProperty('@treeseed/api');
		expect(DEFAULT_ADMIN_COMMERCE_PROVIDER.id).toBe('none');
		expect(DEFAULT_SECRET_MANAGER_PROVIDERS[0]?.id).toBe('treeseed-local-encrypted');
		expect(readFileSync('src/lib/market/api-client.ts', 'utf8')).toContain('getCommerceVendorSalesSummary');
	});

	it('builds declarations and valid package exports', () => {
		const distFiles = filesUnder('dist');
		const declarations = new Set(distFiles.filter((path) => path.endsWith('.d.ts')).map((path) => path.slice(5, -5)));
		const missing = distFiles.filter((path) => extname(path) === '.js').map((path) => path.slice(5, -3)).filter((path) => !declarations.has(path));
		expect(missing).toEqual([]);
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { exports?: Record<string, unknown> };
		const missingTargets = Object.values(packageJson.exports ?? {}).flatMap(exportTargets)
			.filter((target) => !target.includes('*'))
			.filter((target) => !existsSync(resolve(target)));
		expect(missingTargets).toEqual([]);
	});

	it('keeps hosted deployment suspended', () => {
		expect(existsSync('.github/workflows/deploy.yml')).toBe(false);
		expect(readFileSync('.github/workflows/release-gate.yml', 'utf8')).not.toContain('trsd hosting apply');
	});
});

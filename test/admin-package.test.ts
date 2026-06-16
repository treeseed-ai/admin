import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import adminPlugin, { ADMIN_CAPABILITIES, ADMIN_ENV_SCHEMA } from '../src/plugin';
import type { TreeseedPluginSiteContext, TreeseedSiteExtensionContribution } from '@treeseed/sdk/platform/plugin';
import { ADMIN_ROUTES } from '../src/routes';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from '../src/commerce';
import { DEFAULT_SECRET_MANAGER_PROVIDERS } from '../src/secret-managers';

function filesUnder(root: string): string[] {
	const resolved = resolve(root);
	if (!existsSync(resolved)) return [];
	const entries: string[] = [];
	for (const name of readdirSync(resolved)) {
		const path = join(resolved, name);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			entries.push(...filesUnder(path));
		} else {
			entries.push(relative(process.cwd(), path).replace(/\\/gu, '/'));
		}
	}
	return entries;
}

function routePatternFromPage(path: string) {
	const normalized = path.replace(/\\/gu, '/').replace(/^src\/pages/u, '').replace(/\.(astro|ts|js)$/u, '');
	const route = normalized.replace(/\/index$/u, '') || '/';
	return route;
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

describe('@treeseed/admin package boundaries', () => {
	it('registers the distributable admin route surfaces', () => {
		expect(ADMIN_ROUTES).toEqual(expect.arrayContaining([
			expect.objectContaining({ pattern: '/app' }),
			expect.objectContaining({ pattern: '/auth/sign-in' }),
			expect.objectContaining({ pattern: '/app/commons' }),
			expect.objectContaining({ pattern: '/app/commons/participants' }),
			expect.objectContaining({ pattern: '/app/commons/proposals/[proposalId]' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/products' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/products/[productId]/governance' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/sales' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/services' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/services/[requestId]' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/capacity' }),
			expect.objectContaining({ pattern: '/app/teams/[teamId]/commerce/capacity/[listingId]' }),
			expect.objectContaining({ pattern: '/market' }),
			expect.objectContaining({ pattern: '/team-invites/[token]/accept' }),
			expect.objectContaining({ pattern: '/v1/[...all]' }),
		]));
	});

	it('contributes UI package styles from the admin plugin', () => {
		const siteHooks = resolveSiteHooks();
		const css = siteHooks.customCss ?? [];
		expect(css).toContain('@treeseed/ui/styles/tokens.css');
		expect(css).toContain('@treeseed/ui/styles/app-shell.css');
		expect(css).toContain('@treeseed/ui/styles/market.css');
		expect(ADMIN_CAPABILITIES.ecommerce.bundled).toBe(false);
		expect(siteHooks.envSchema).toBe(ADMIN_ENV_SCHEMA);
		expect(Object.keys(ADMIN_ENV_SCHEMA)).toEqual(expect.arrayContaining([
			'TREESEED_BETTER_AUTH_SECRET',
			'TREESEED_WEB_SERVICE_SECRET',
			'TREESEED_MARKET_API_BASE_URL',
			'TREESEED_ADMIN_SECRET_MANAGER_PROVIDER',
		]));
	});

	it('uses @treeseed/ui exports without importing root source paths', () => {
		const sources = filesUnder('src')
			.filter((path) => /\.(astro|tsx?|jsx?|mjs|cjs)$/u.test(path))
			.map((path) => [path, readFileSync(path, 'utf8')] as const);
		expect(sources.some(([, source]) => source.includes('@treeseed/ui/'))).toBe(true);
		for (const [path, source] of sources) {
			expect(source, path).not.toMatch(/from ['"](?:\.\.\/)+src\//u);
			expect(source, path).not.toMatch(/from ['"]src\//u);
			expect(source, path).not.toMatch(/packages\/(?:ui|core|sdk|api)\/src/u);
			expect(source, path).not.toMatch(/(?:from|import)\s*['"](?:\.\.\/){3,}src\//u);
		}
	});

	it('keeps route registration exact for all admin-owned pages', () => {
		const pageRoutes = filesUnder('src/pages')
			.filter((path) => /\.(astro|ts)$/u.test(path))
			.map(routePatternFromPage)
			.sort();
		const registeredRoutes = ADMIN_ROUTES.map((route) => route.pattern).sort();
		const registeredResources = ADMIN_ROUTES.map((route) => route.resourcePath).filter((path): path is string => typeof path === 'string').sort();
		const pageResources = filesUnder('src/pages')
			.filter((path) => /\.(astro|ts)$/u.test(path))
			.map((path) => path.replace(/^src\//u, ''))
			.sort();

		expect(registeredRoutes).toEqual(pageRoutes);
		expect(registeredResources).toEqual(pageResources);
		for (const resourcePath of registeredResources) {
			expect(existsSync(resolve(process.cwd(), 'src', resourcePath)), resourcePath).toBe(true);
		}
	});

	it('builds declarations for every exported JavaScript module', () => {
		const distFiles = filesUnder('dist');
		const javascriptModules = distFiles
			.filter((path) => extname(path) === '.js')
			.map((path) => path.slice('dist/'.length, -'.js'.length));
		const declarations = new Set(distFiles
			.filter((path) => path.endsWith('.d.ts'))
			.map((path) => path.slice('dist/'.length, -'.d.ts'.length)));
		const missingDeclarations = javascriptModules.filter((modulePath) => !declarations.has(modulePath));

		expect(missingDeclarations).toEqual([]);
	});

	it('ships package-local verify, release gate, and publish workflows', () => {
		const verifyWorkflow = readFileSync('.github/workflows/verify.yml', 'utf8');
		const deployWorkflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
		const publishWorkflow = readFileSync('.github/workflows/publish.yml', 'utf8');
		const packageManifest = readFileSync('treeseed.package.yaml', 'utf8');
		const checkTagScript = readFileSync('scripts/assert-release-tag-version.mjs', 'utf8');
		const publishScript = readFileSync('scripts/publish-package.mjs', 'utf8');

		expect(packageManifest).toContain('workflow: deploy.yml');
		expect(verifyWorkflow).toContain('npm run verify:direct');
		expect(deployWorkflow).toContain('npm run verify:local');
		expect(deployWorkflow).not.toContain('trsd hosting apply');
		expect(publishWorkflow).toContain("startsWith(github.ref, 'refs/tags/')");
		expect(publishWorkflow).toContain("!contains(github.ref_name, '-')");
		expect(publishWorkflow).toContain('npm publish --access public');
		expect(publishWorkflow).toContain('gh release create "${GITHUB_REF_NAME}"');
		expect(checkTagScript).toContain('^\\d+\\.\\d+\\.\\d+$');
		expect(publishScript).toContain('Refusing to publish');
		expect(publishScript).toContain('process.exit(result.status ?? 1)');
	});

	it('keeps package exports and dependencies release-ready', () => {
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
			peerDependencies?: Record<string, string>;
			peerDependenciesMeta?: Record<string, { optional?: boolean }>;
			exports?: Record<string, unknown>;
		};
		const targets = Object.values(packageJson.exports ?? {}).flatMap(exportTargets);
		const missingTargets = targets
			.filter((target) => !target.includes('*'))
			.filter((target) => !existsSync(resolve(process.cwd(), target)));

		expect(missingTargets).toEqual([]);
		expect(packageJson.dependencies).not.toHaveProperty('@treeseed/api');
		expect(packageJson.dependencies).not.toHaveProperty('@treeseed/agent');
		expect(packageJson.peerDependencies).not.toHaveProperty('@treeseed/api');
		expect(packageJson.peerDependenciesMeta?.['@treeseed/api']).toBeUndefined();
		expect(packageJson.devDependencies).not.toHaveProperty('@treeseed/api');
		expect(packageJson.dependencies).toHaveProperty('@mdxeditor/editor');
	});

	it('falls back to local encrypted secrets and does not require commerce', async () => {
		expect(DEFAULT_SECRET_MANAGER_PROVIDERS[0]?.id).toBe('treeseed-local-encrypted');
		expect(DEFAULT_SECRET_MANAGER_PROVIDERS.map((provider) => provider.id)).toEqual(expect.arrayContaining([
			'treeseed-local-encrypted',
			'github-actions',
			'cloudflare',
			'railway',
		]));

		const checkoutUrl = await DEFAULT_ADMIN_COMMERCE_PROVIDER.checkoutUrl?.({}, { mode: 'one_time' });
		const entitlement = await DEFAULT_ADMIN_COMMERCE_PROVIDER.resolveEntitlement?.({}, { offerMode: 'free' });
		expect(checkoutUrl).toBeNull();
		expect(entitlement?.allowed).toBe(true);
	});

	it('requires a host commerce provider for commercial offer modes', async () => {
		for (const mode of ['one_time', 'one_time_current_version', 'subscription', 'subscription_updates', 'professional_hosting', 'scoped_contract'] as const) {
			const entitlement = await DEFAULT_ADMIN_COMMERCE_PROVIDER.resolveEntitlement?.({}, { offerMode: mode });
			expect(entitlement?.allowed, mode).toBe(false);
			expect(entitlement?.checkoutUrl, mode).toBeNull();
			expect(entitlement?.reason, mode).toContain('commerce provider');
		}
	});

	it('does not bundle payment ecommerce implementation', () => {
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
			peerDependencies?: Record<string, string>;
		};
		const sources = filesUnder('src')
			.filter((path) => /\.(astro|tsx?|jsx?|mjs|cjs)$/u.test(path))
			.map((path) => [path, readFileSync(path, 'utf8')] as const);
		const paymentImplementationTerms = /\b(checkout session|payment intent|seller payout|application fee|webhook secret)\b/iu;
		const offenders = sources
			.filter(([, source]) => paymentImplementationTerms.test(source) || /from ['"](?:stripe|@stripe\/stripe-js)['"]/u.test(source))
			.map(([path]) => path);
		const apiClient = readFileSync('src/lib/market/api-client.ts', 'utf8');

		expect(packageJson.dependencies).not.toHaveProperty('stripe');
		expect(packageJson.dependencies).not.toHaveProperty('@stripe/stripe-js');
		expect(packageJson.devDependencies).not.toHaveProperty('stripe');
		expect(packageJson.peerDependencies).not.toHaveProperty('stripe');
		expect(offenders).toEqual([]);
		expect(apiClient).toContain('getCommerceVendorSalesSummary');
		expect(apiClient).toContain('getCommonsSummary');
		expect(apiClient).toContain('listCommonsProposals');
		expect(apiClient).toContain('stewardDecisionForCommonsProposal');
		expect(apiClient).toContain('backfillCommonsParticipants');
		expect(apiClient).toContain('getCommerceVendorMonitoring');
		expect(apiClient).toContain('listCommerceMarketplaceProducts');
		expect(apiClient).toContain('getCommerceOwnershipWorkflow');
		expect(apiClient).toContain('updateCommerceOwnershipRecord');
		expect(apiClient).toContain('createCommerceSuccessionEvent');
		expect(apiClient).toContain('createCommerceOrderRefund');
		expect(apiClient).toContain('fulfillCommerceOrderItemArtifact');
		expect(apiClient).toContain('listCommerceServiceRequests');
		expect(apiClient).toContain('createCommerceServiceQuote');
		expect(apiClient).not.toContain('checkoutCommerceServiceContract');
		expect(apiClient).toContain('fulfillCommerceServiceContract');
		expect(apiClient).toContain('listCommerceCapacityListings');
		expect(apiClient).toContain('createCommerceCapacityListing');
		expect(apiClient).toContain('submitCommerceCapacityListing');
		expect(apiClient).toContain('approveCommerceCapacityListing');
		expect(apiClient).toContain('listCommerceCapacityListingInquiries');
		expect(apiClient).toContain('approveCommerceCapacityInquiryForScoping');
		expect(DEFAULT_ADMIN_COMMERCE_PROVIDER.id).toBe('none');
	});

	it('does not own a hostable site manifest', () => {
		expect(existsSync(resolve(process.cwd(), 'treeseed.site.yaml'))).toBe(false);
	});
});

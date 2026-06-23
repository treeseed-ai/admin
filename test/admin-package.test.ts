import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import adminPlugin, { ADMIN_CAPABILITIES, ADMIN_ENV_SCHEMA } from '../src/plugin';
import type { TreeseedPluginSiteContext, TreeseedSiteExtensionContribution } from '@treeseed/sdk/platform/plugin';
import { ADMIN_ROUTES } from '../src/routes';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from '../src/commerce';
import {
	buildAdminGitHubActionsSecretDeploymentBody,
	buildAdminClientEncryptedEscrowBody,
	DEFAULT_SECRET_MANAGER_PROVIDERS,
	describeAdminSecretCapabilityState,
	describeAdminClientEncryptedEscrowStatus,
} from '../src/secret-managers';
import { hostEncryptedPayloadToClientEscrowEnvelope } from '../src/lib/host-crypto';

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

	it('renders capacity runtime execution visibility through SDK projections only', () => {
		const runtimePage = readFileSync('src/pages/app/capacity/runtime.astro', 'utf8');
		expect(runtimePage).toContain('@treeseed/sdk/agent-capacity');
		expect(runtimePage).toContain('summarizeExecutionProviderVisibility');
		expect(runtimePage).toContain("label: 'Execution'");
		expect(runtimePage).toContain("label: 'External'");
		expect(runtimePage).toContain("label: 'Capabilities'");
		expect(runtimePage).toContain("label: 'Artifacts'");
		expect(runtimePage).not.toContain('packages/api');
		expect(runtimePage).not.toContain('provider/runner');
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
		const checkTagScript = readFileSync('scripts/assert-release-tag-version.ts', 'utf8');
		const publishScript = readFileSync('scripts/publish-package.ts', 'utf8');

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

		const checkoutUrl = await DEFAULT_ADMIN_COMMERCE_PROVIDER.checkoutUrl?.({}, { mode: 'paid' });
		const entitlement = await DEFAULT_ADMIN_COMMERCE_PROVIDER.resolveEntitlement?.({}, { mode: 'free' });
		expect(checkoutUrl).toBeNull();
		expect(entitlement?.allowed).toBe(true);
	});

	it('builds client-encrypted escrow payloads and safe status labels', () => {
		const body = buildAdminClientEncryptedEscrowBody({
			id: 'escrow-1',
			secretId: 'secret-1',
			name: 'TREESEED_PROJECT_SECRET',
			secretClass: 'customer_project_secret',
			ciphertext: 'base64-ciphertext',
			ciphertextRef: 'api://projects/project-1/secrets/escrow/escrow-1',
			algorithm: 'xchacha20-poly1305',
			nonce: 'base64-nonce',
			salt: 'base64-salt',
			kdf: 'argon2id',
			kdfParams: { memoryKiB: 65536, iterations: 3, parallelism: 1 },
			wrappingKeyId: 'client-key-1',
			encryptionVersion: 'v1',
			deploymentIntent: { targetMode: 'github_actions_secret_enclave' },
		});

		expect(body).toMatchObject({
			ciphertext: 'base64-ciphertext',
			recoveryPolicy: 'reentry_required',
		});
		expect(JSON.stringify(body)).not.toContain('passphrase');
		expect(() => buildAdminClientEncryptedEscrowBody({
			...body,
			passphrase: 'do-not-send',
		} as any)).toThrow();
		expect(describeAdminClientEncryptedEscrowStatus({
			...body,
			status: 'migrated',
			migratedTo: 'github_actions_secret_enclave',
		})).toMatchObject({
			label: 'migrated',
			escrowed: false,
			migrated: true,
		});
		expect(buildAdminGitHubActionsSecretDeploymentBody({
			repository: 'owner/repo',
			scope: 'environment',
			environment: 'production',
			secretName: 'TREESEED_SECRET',
			encryptedValue: 'github-encrypted-value',
			keyId: 'key-1',
		})).toMatchObject({
			custodyMode: 'github_actions_secret_enclave',
			encryptedValue: 'github-encrypted-value',
		});
		expect(() => buildAdminGitHubActionsSecretDeploymentBody({
			repository: 'owner/repo',
			scope: 'environment',
			environment: 'production',
			secretName: 'TREESEED_SECRET',
			encryptedValue: 'github-encrypted-value',
			keyId: 'key-1',
			rawSecret: 'do-not-send',
		} as any)).toThrow();
		expect(describeAdminSecretCapabilityState({
			custodyMode: 'host_env_injection',
		})).toMatchObject({
			label: 'host-injected',
			hostInjected: true,
		});
		expect(describeAdminSecretCapabilityState({
			custodyMode: 'client_encrypted_escrow',
			id: 'escrow-1',
			secretId: 'secret-1',
			ciphertextRef: 'api://projects/project-1/secrets/escrow/escrow-1',
			algorithm: 'xchacha20-poly1305',
			wrappingKeyId: 'client-key-1',
			expiresAt: '2000-01-01T00:00:00.000Z',
		})).toMatchObject({
			label: 're-entry required',
			reentryRequired: true,
		});
		const hostEnvelope = hostEncryptedPayloadToClientEscrowEnvelope({
			version: 1,
			algorithm: 'secretbox',
			kdf: { algorithm: 'argon2id', opsLimit: 2, memLimit: 8192 },
			salt: 'base64-salt',
			nonce: 'base64-nonce',
			ciphertext: 'base64-ciphertext',
		}, {
			id: 'host-escrow-1',
			secretId: 'host-secret-1',
			ciphertextRef: 'admin://teams/team-1/hosts/web/draft/credentials',
			wrappingKeyId: 'admin-sensitive-unlock-passphrase',
			deploymentIntent: { targetMode: 'host_env_injection' },
		});
		expect(hostEnvelope).toMatchObject({
			ciphertext: 'base64-ciphertext',
			kdf: 'argon2id',
			deploymentIntent: { targetMode: 'host_env_injection' },
		});
		expect(JSON.stringify(hostEnvelope)).not.toContain('passphrase-value');
	});

	it('does not bundle payment ecommerce implementation', () => {
		const sources = filesUnder('src')
			.filter((path) => /\.(astro|tsx?|jsx?|mjs|cjs)$/u.test(path))
			.map((path) => [path, readFileSync(path, 'utf8')] as const);
		const paymentTerms = /\b(stripe|checkout session|invoice|coupon|seller payout|payment provider|payment intent)\b/iu;
		const offenders = sources
			.filter(([path]) => path !== 'src/commerce.ts')
			.filter(([, source]) => paymentTerms.test(source))
			.map(([path]) => path);

		expect(offenders).toEqual([]);
		expect(DEFAULT_ADMIN_COMMERCE_PROVIDER.id).toBe('none');
	});

	it('does not own a hostable site manifest', () => {
		expect(existsSync(resolve(process.cwd(), 'treeseed.site.yaml'))).toBe(false);
	});
});

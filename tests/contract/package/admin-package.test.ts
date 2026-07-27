import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import adminPlugin, { ADMIN_CAPABILITIES, ADMIN_ENV_SCHEMA } from '../../../src/plugin';
import type { PluginSiteContext, SiteExtensionContribution } from '@treeseed/sdk/platform/plugin';
import { ADMIN_ROUTES, ADMIN_SUPPORT_ROUTES } from '../../../src/routes';
import { DEFAULT_ADMIN_COMMERCE_PROVIDER } from '../../../src/commerce';
import { DEFAULT_SECRET_MANAGER_PROVIDERS } from '../../../src/secret-managers';
import { authenticatedAuthRedirect, isAnonymousAuthRoute } from '../../../src/lib/auth/support/access-policy';

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

function resolveSiteHooks(): SiteExtensionContribution {
	const hooks = adminPlugin.siteHooks;
	if (!hooks) return {};
	if (typeof hooks !== 'function') return hooks;
	return hooks({
		projectRoot: process.cwd(),
		tenantConfig: {} as PluginSiteContext['tenantConfig'],
		pluginConfig: {},
	} satisfies PluginSiteContext);
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

	it('keeps anonymous authentication routes inaccessible to active sessions', () => {
		const anonymousRoutes = [
			'/auth/register',
			'/auth/check-email',
			'/auth/sign-in',
			'/auth/forgot-password',
			'/auth/reset-password',
			'/auth/callback/github',
		];
		for (const route of anonymousRoutes) {
			expect(isAnonymousAuthRoute(route), route).toBe(true);
			expect(authenticatedAuthRedirect(route, true), route).toBe('/app/');
			expect(authenticatedAuthRedirect(route, false), route).toBe('/auth/username?returnTo=%2Fapp%2F');
		}
		for (const route of ['/auth/confirm-email', '/auth/logout', '/auth/username', '/auth/device/approve', '/team-invites/token/accept']) {
			expect(isAnonymousAuthRoute(route), route).toBe(false);
			expect(authenticatedAuthRedirect(route, true), route).toBeNull();
		}
		const routes = new Map(ADMIN_ROUTES.map((route) => [route.pattern, route.capability?.accessPolicy ?? []]));
		for (const route of [
			'/auth/register',
			'/auth/check-email',
			'/auth/sign-in',
			'/auth/forgot-password',
			'/auth/reset-password',
			'/auth/callback/[provider]',
		]) {
			expect(routes.get(route), route).toContain('anonymous principal only');
		}
		expect(routes.get('/auth/confirm-email')).toEqual(expect.arrayContaining([
			'valid one-time confirmation token',
			'anonymous or signed-in principal',
			'safe return URL',
		]));
	});

	it('keeps navigation limited to identity and team management', () => {
		const appLayout = readFileSync('src/layouts/AppLayout.astro', 'utf8');
		const publicLayout = readFileSync('src/layouts/PublicLayout.astro', 'utf8');
		for (const target of ['/app/', '/app/account', '/app/teams', '/app/teams/new']) {
			expect(appLayout).toContain(target);
		}
		for (const target of ['/app/projects', '/app/capacity', '/app/work', '/app/knowledge', '/market', '/cart', '/seller']) {
			const escaped = target.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
			expect(appLayout).not.toMatch(new RegExp(`(?:href|action)\\s*[:=]\\s*['"\\x60]${escaped}`, 'u'));
		}
		expect(appLayout).not.toContain('accountNotifications');
		expect(appLayout).not.toMatch(/\bnotifications=/u);
		expect(appLayout).toContain('SITE_SLOGAN');
		expect(appLayout).toContain("from '@treeseed/ui/site-brand'");
		expect(appLayout).toContain("from '@treeseed/ui/components/astro/shell/navigation/ShellIcon.astro'");
		for (const icon of ['start', 'team-settings', 'account', 'sign-out']) {
			expect(appLayout).toContain(`icon: '${icon}'`);
		}
		expect(appLayout).not.toContain("{ label: 'Teams'");
		expect(appLayout).toContain('<ShellIcon name="teams"');
		expect(appLayout).toContain('iconOnly: true');
		expect(appLayout).toContain('title="Manage teams"');
		expect(appLayout).not.toContain("from '@treeseed/ui'");
		expect(appLayout).not.toContain('Identity and teams');
		expect(publicLayout).toContain('SITE_SLOGAN');
		expect(publicLayout).toContain("from '@treeseed/ui/site-brand'");
		expect(publicLayout).not.toContain("from '@treeseed/ui'");
		expect(publicLayout).not.toContain('ShellIconLink');
	});

	it('assigns every app page to exactly one visible page-header owner', () => {
		const appLayout = readFileSync('src/layouts/AppLayout.astro', 'utf8');
		const appPages = filesUnder('src/pages/app').filter((path) => path.endsWith('.astro'));

		expect(appLayout).toContain('contentOwnsPageHeader={contentOwnsPageHeader}');
		for (const path of appPages) {
			const source = readFileSync(path, 'utf8');
			const contentTemplateOwnsHeader = /<(?:DashboardTemplate|SettingsTemplate)\b/u.test(source);
			expect(source.includes('contentOwnsPageHeader'), path).toBe(contentTemplateOwnsHeader);
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

	it('uses one password setup interaction for registration, reset, and account changes', () => {
		const reset = readFileSync('src/pages/auth/reset-password.astro', 'utf8');
		const accountSettings = readFileSync('src/view-models/account-settings.ts', 'utf8');
		const registrationScene = readFileSync('guarantees/user/auth/scenes/register-user.scene.yaml', 'utf8');

		expect(reset).toContain("PasswordSetupFields from '@treeseed/ui/components/astro/forms/fields/PasswordSetupFields.astro'");
		expect(reset).toContain('passwordId="resetPassword"');
		expect(reset).toContain('confirmLabel="Confirm new password"');
		expect(accountSettings).toContain("const confirmPassword = String(form.get('confirmPassword') ?? '')");
		expect(accountSettings).toContain("if (password !== confirmPassword) throw new Error('Passwords do not match.')");
		expect(accountSettings).toContain('if (!passwordMeetsPolicy(password))');
		expect(registrationScene).toContain('[data-ts-confirm-password-input]');
		expect(registrationScene).not.toContain('[data-confirm-password-input]');
	});

	it('uses one account timezone and timestamp presentation contract', () => {
		const accountPage = readFileSync('src/pages/app/account/index.astro', 'utf8');
		const sessionsPage = readFileSync('src/pages/app/account/sessions.astro', 'utf8');
		const notificationsPage = readFileSync('src/pages/app/account/notifications.astro', 'utf8');
		const accountHandler = readFileSync('src/view-models/account-settings.ts', 'utf8');
		const appLayout = readFileSync('src/layouts/AppLayout.astro', 'utf8');

		expect(accountPage).toContain('AccountTimeZoneSettings');
		expect(accountHandler).toContain("intent === 'time-zone'");
		expect(accountHandler).toContain('updateAccountPreferences');
		expect(appLayout).toContain('timeZone={preferences.timeZone}');
		expect(sessionsPage).toContain(
			"SessionManager from '@treeseed/ui/components/astro/account/SessionManager.astro'",
		);
		expect(sessionsPage).toContain('timeZone={frame.preferences.timeZone}');
		expect(notificationsPage).toContain(
			"NotificationPreferencePanel from '@treeseed/ui/components/astro/account/NotificationPreferencePanel.astro'",
		);
	});

	it('routes network forms through the UI-owned enhanced submission contract', () => {
		const astroSources = filesUnder('src')
			.filter((path) => path.endsWith('.astro'))
			.map((path) => [path, readFileSync(path, 'utf8')] as const);
		const postFormConsumers = astroSources.filter(([, source]) => (
			/<form\b[^>]*\bmethod=(?:["']POST["']|["']post["']|\{[^}]*post[^}]*\})/u.test(source)
		));
		for (const [path, source] of postFormConsumers) {
			expect(source, `${path} should use delegated enhancement`).toContain('data-ts-submit="enhanced"');
		}

		const accountHandler = readFileSync('src/view-models/account-settings.ts', 'utf8');
		const pageHelper = readFileSync('src/lib/forms/page-submission.ts', 'utf8');
		const memberPage = readFileSync('src/pages/app/teams/[teamId]/members.astro', 'utf8');
		const authPages = [
			'src/pages/auth/register.astro',
			'src/pages/auth/sign-in.astro',
			'src/pages/auth/forgot-password.astro',
			'src/pages/auth/reset-password.astro',
			'src/pages/auth/username.astro',
		].map((path) => readFileSync(path, 'utf8')).join('\n');

		expect(accountHandler).toContain("from '@treeseed/ui/forms'");
		expect(accountHandler).not.toContain('Astro.redirect');
		expect(pageHelper).toContain('formSubmissionResponse');
		expect(authPages).toContain('pageFormResponse');
		expect(authPages).toContain('pageFormFailure');
		expect(memberPage).toContain('data-ts-form-adapter="json"');
		expect(memberPage).not.toContain('location.reload');
		expect(memberPage).not.toMatch(/\bfetch\s*\(/u);
	});

	it('keeps inline guarantee mutations on their route and proves success toasts', () => {
		const scenePaths = [
			'guarantees/user/account/scenes/edit-account-settings.scene.yaml',
			'guarantees/user/account/scenes/manage-appearance.scene.yaml',
			'guarantees/user/account/scenes/manage-notifications.scene.yaml',
			'guarantees/user/account/scenes/manage-sessions.scene.yaml',
			'guarantees/team/scenes/edit-team-settings.scene.yaml',
			'guarantees/team/membership/scenes/change-member-role.scene.yaml',
			'guarantees/team/membership/scenes/remove-team-member.scene.yaml',
		];
		for (const path of scenePaths) {
			const scene = readFileSync(path, 'utf8');
			expect(scene, path).toContain('[data-ts-toast-id][data-tone="success"]');
			expect(scene, path).not.toMatch(/urlIncludes:\s*(?:saved|updated|removed)=/u);
		}
	});

	it('retains domain facades without route-specific UI dependencies', () => {
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies?: Record<string, string> };
		expect(packageJson.dependencies).not.toHaveProperty('@mdxeditor/editor');
		expect(packageJson.dependencies).not.toHaveProperty('libsodium-wrappers-sumo');
		expect(packageJson.dependencies).not.toHaveProperty('@treeseed/api');
		expect(DEFAULT_ADMIN_COMMERCE_PROVIDER.id).toBe('none');
		expect(DEFAULT_SECRET_MANAGER_PROVIDERS[0]?.id).toBe('treeseed-local-encrypted');
		expect(readFileSync('src/lib/market/api-client/commerce/vendors/queries/get-commerce-vendor-sales-summary.ts', 'utf8')).toContain('getCommerceVendorSalesSummaryMethod');
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

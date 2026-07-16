import { defineTreeseedRoute, validateTreeseedRouteCapabilities, type TreeseedRouteCapability, type TreeseedSiteRouteContribution } from '@treeseed/sdk/platform/plugin';

type CapabilityInput = Partial<TreeseedRouteCapability> & Pick<TreeseedRouteCapability, 'id' | 'description'>;

function adminRoute(pattern: string, resourcePath: string, input: CapabilityInput): TreeseedSiteRouteContribution {
	const auth = pattern.startsWith('/auth');
	const personal = pattern === '/app' || pattern.startsWith('/app/account');
	const team = pattern.startsWith('/app/teams') || pattern.startsWith('/t/') || pattern.startsWith('/team-invites');
	const support = pattern.startsWith('/v1/');
	return defineTreeseedRoute({ pattern, resourcePath, capability: {
		owner: 'admin',
		responseKind: support ? 'proxy' : pattern === '/auth/logout' || pattern.startsWith('/team-invites') ? 'redirect' : 'page',
		archetype: auth ? 'auth-form' : pattern === '/app' ? 'dashboard' : pattern.startsWith('/u/') || pattern.startsWith('/t/') ? 'profile' : pattern.includes('/delete') || personal ? 'settings' : pattern.endsWith('/new') ? 'wizard' : 'collection',
		shell: auth ? 'AuthShell' : personal || pattern.startsWith('/app/teams') ? 'AuthenticatedAppShell' : support ? 'Standalone' : 'PublicSingleColumnShell',
		template: auth ? 'AuthCard' : pattern === '/app' ? 'DashboardTemplate' : pattern.startsWith('/u/') || pattern.startsWith('/t/') ? 'ProfileTemplate' : support ? 'Standalone' : pattern.endsWith('/new') ? 'WizardTemplate' : pattern.startsWith('/app/account') || pattern.includes('/delete') ? 'SettingsTemplate' : 'CollectionTemplate',
		surface: auth ? 'auth' : personal ? 'personal' : team ? 'team' : support ? 'system' : 'public',
		resourceType: auth ? 'auth-session' : personal ? 'account' : team ? 'team' : support ? 'api-proxy' : 'user-profile',
		accessPolicy: auth ? ['anonymous-safe auth flow', 'safe return URL'] : support ? ['target API policy'] : pattern.startsWith('/u/') || pattern.startsWith('/t/') ? ['public read'] : ['signed-in principal'],
		viewModelDependencies: ['Admin auth/session API facade'],
		navigation: auth || support || pattern.includes('/delete') ? 'hidden' : personal ? 'secondary' : 'contextual',
		states: ['loading', 'forbidden', 'unavailable', 'validation', 'conflict', 'retry', 'success', 'not-found'],
		selector: `route-${input.id.replaceAll('.', '-')}`,
		status: 'active',
		guarantees: [],
		...input,
	} });
}

export const ADMIN_ROUTES: readonly TreeseedSiteRouteContribution[] = validateTreeseedRouteCapabilities([
	adminRoute('/app', 'pages/app/index.astro', { id: 'admin.app.start', description: 'Authenticated identity and active-team start dashboard.', guarantees: ['guarantee.route.registry'] }),
	adminRoute('/app/account', 'pages/app/account/index.astro', { id: 'admin.account.identity', description: 'Identity, immutable username, verified email, password, and connected-provider settings.', guarantees: ['guarantee.user.account.edit-account-settings.006'] }),
	adminRoute('/app/account/sessions', 'pages/app/account/sessions.astro', { id: 'admin.account.sessions', description: 'Account session collection with current-session protection and revocation.', guarantees: ['guarantee.user.account.manage-sessions.007'] }),
	adminRoute('/app/account/notifications', 'pages/app/account/notifications.astro', { id: 'admin.account.notifications', description: 'Global and per-project content notification preferences and email cadence.', guarantees: ['guarantee.user.account.manage-notifications.011'] }),
	adminRoute('/app/account/appearance', 'pages/app/account/appearance.astro', { id: 'admin.account.appearance', description: 'Personal theme creation and management; activation remains in the shell selector.', guarantees: ['guarantee.user.account.manage-appearance.009'] }),
	adminRoute('/app/account/delete', 'pages/app/account/delete.astro', { id: 'admin.account.delete', description: 'Blocked, reauthenticated, exact-confirmation account deletion.', guarantees: ['guarantee.user.account.delete-user.011'] }),
	adminRoute('/app/teams', 'pages/app/teams/index.astro', { id: 'admin.team.collection', description: 'Teams available to the principal and active-team selection.' }),
	adminRoute('/app/teams/new', 'pages/app/teams/new.astro', { id: 'admin.team.create', description: 'Authenticated team creation.' }),
	adminRoute('/app/teams/[teamId]/edit', 'pages/app/teams/[teamId]/edit.astro', { id: 'admin.team.edit', description: 'Authorized team identity settings.' }),
	adminRoute('/app/teams/[teamId]/delete', 'pages/app/teams/[teamId]/delete.astro', { id: 'admin.team.delete', description: 'Authorized, blocker-aware team deletion.' }),
	adminRoute('/app/teams/[teamId]/members', 'pages/app/teams/[teamId]/members.astro', { id: 'admin.team.members', description: 'Team membership, invitation, role, and removal operations.' }),
	adminRoute('/auth/register', 'pages/auth/register.astro', { id: 'admin.auth.register', description: 'Credential registration with username/email availability and immutable username disclosure.', guarantees: ['guarantee.user.auth.register-user.001'] }),
	adminRoute('/auth/check-email', 'pages/auth/check-email.astro', { id: 'admin.auth.check-email', description: 'Hidden verification/reset check-inbox continuation.', archetype: 'message', template: 'MessageTemplate' }),
	adminRoute('/auth/confirm-email', 'pages/auth/confirm-email.astro', { id: 'admin.auth.confirm-email', description: 'Email-confirmation token result and recovery.', archetype: 'message', guarantees: ['guarantee.user.auth.verify-email.002'] }),
	adminRoute('/auth/sign-in', 'pages/auth/sign-in.astro', { id: 'admin.auth.sign-in', description: 'Credential and configured-provider sign-in.', guarantees: ['guarantee.user.auth.user-login.004'] }),
	adminRoute('/auth/logout', 'pages/auth/logout.ts', { id: 'admin.auth.logout', description: 'CSRF-safe POST session termination; non-mutating GET redirect.', responseKind: 'redirect', archetype: 'redirect', accessPolicy: ['GET is non-mutating', 'POST requires signed-in session and double-submit CSRF'], guarantees: ['guarantee.user.auth.user-logout.005'] }),
	adminRoute('/auth/forgot-password', 'pages/auth/forgot-password.astro', { id: 'admin.auth.forgot-password', description: 'Privacy-safe password-reset request.' }),
	adminRoute('/auth/reset-password', 'pages/auth/reset-password.astro', { id: 'admin.auth.reset-password', description: 'Token-bound password reset.', guarantees: ['guarantee.user.auth.forgot-reset-password.003'] }),
	adminRoute('/auth/username', 'pages/auth/username.astro', { id: 'admin.auth.username-claim', description: 'Permanent username claim for first-time provider users.', accessPolicy: ['restricted provider-onboarding session', 'username not already assigned', 'safe return URL'] }),
	adminRoute('/auth/device/approve', 'pages/auth/device/approve.astro', { id: 'admin.auth.device-approve', description: 'Authenticated CLI/device authorization approval.', accessPolicy: ['signed-in principal', 'valid pending device request'] }),
	adminRoute('/auth/callback/[provider]', 'pages/auth/callback/[provider].ts', { id: 'admin.auth.provider-callback', description: 'Hidden configured-provider callback with one-time state, nonce, PKCE, and safe redirect.', responseKind: 'redirect', archetype: 'redirect', accessPolicy: ['configured provider', 'one-time database state', 'nonce and PKCE validation', 'safe return URL'] }),
	adminRoute('/u/[username]', 'pages/u/[username].astro', { id: 'admin.profile.user', description: 'Public identity-only user profile.', guarantees: ['guarantee.user.account.view-user-profile.010'] }),
	adminRoute('/t/[name]', 'pages/t/[name].astro', { id: 'admin.profile.team', description: 'Public identity-only team profile.' }),
	adminRoute('/team-invites/[token]/accept', 'pages/team-invites/[token]/accept.astro', { id: 'admin.team.invite-accept', description: 'Idempotent invitation acceptance and safe destination.' }),
]);

export const ADMIN_SUPPORT_ROUTES: readonly TreeseedSiteRouteContribution[] = validateTreeseedRouteCapabilities([
	adminRoute('/v1/[...all]', 'pages/v1/[...all].ts', {
		id: 'admin.support.api-proxy',
		description: 'Same-origin authenticated API facade with double-submit CSRF enforcement.',
		responseKind: 'proxy', archetype: 'action', shell: 'Standalone', template: 'Standalone', surface: 'system', resourceType: 'api-proxy',
		accessPolicy: ['target API policy', 'double-submit CSRF for cookie-authenticated mutation'], navigation: 'hidden',
	}),
]);

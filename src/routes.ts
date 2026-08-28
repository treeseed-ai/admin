import { defineRoute, validateRouteCapabilities, type RouteCapability, type SiteRouteContribution } from '@treeseed/sdk/site-contracts/plugin';

type CapabilityInput = Partial<RouteCapability> & Pick<RouteCapability, 'id' | 'description'>;

const anonymousAuthPatterns = new Set([
	'/auth/register',
	'/auth/check-email',
	'/auth/sign-in',
	'/auth/forgot-password',
	'/auth/reset-password',
	'/auth/callback/[provider]',
]);

function adminRoute(pattern: string, resourcePath: string, input: CapabilityInput): SiteRouteContribution {
	const auth = pattern.startsWith('/auth');
	const anonymousAuth = anonymousAuthPatterns.has(pattern);
	const app = pattern === '/app' || pattern.startsWith('/app/');
	const personal = pattern === '/app' || pattern.startsWith('/app/account');
	const team = (app && !personal) || pattern.startsWith('/t/') || pattern.startsWith('/team-invites');
	const support = pattern.startsWith('/v1/');
	return defineRoute({ pattern, resourcePath, capability: {
		owner: 'admin',
		responseKind: support ? 'proxy' : pattern === '/auth/logout' || pattern.startsWith('/team-invites') ? 'redirect' : 'page',
		archetype: auth ? 'auth-form' : pattern === '/app' ? 'dashboard' : pattern.startsWith('/u/') || pattern.startsWith('/t/') ? 'profile' : pattern.includes('/delete') || personal ? 'settings' : pattern.endsWith('/new') ? 'wizard' : 'collection',
		shell: auth ? 'AuthShell' : app ? 'AuthenticatedAppShell' : support ? 'Standalone' : 'PublicSingleColumnShell',
		template: auth ? 'AuthCard' : pattern === '/app' ? 'DashboardTemplate' : pattern.startsWith('/u/') || pattern.startsWith('/t/') ? 'ProfileTemplate' : support ? 'Standalone' : pattern.endsWith('/new') ? 'WizardTemplate' : pattern.startsWith('/app/account') || pattern.includes('/delete') ? 'SettingsTemplate' : 'CollectionTemplate',
		surface: auth ? 'auth' : personal ? 'personal' : team ? 'team' : support ? 'system' : 'public',
		resourceType: auth ? 'auth-session' : personal ? 'account' : team ? 'team' : support ? 'api-proxy' : 'user-profile',
		accessPolicy: anonymousAuth ? ['anonymous principal only', 'safe return URL'] : auth ? ['signed-in principal'] : support ? ['target API policy'] : pattern.startsWith('/u/') || pattern.startsWith('/t/') ? ['public read'] : ['signed-in principal'],
		viewModelDependencies: ['Admin auth/session API facade'],
		navigation: auth || support || pattern.includes('/delete') ? 'hidden' : personal ? 'secondary' : 'contextual',
		states: ['loading', 'forbidden', 'unavailable', 'validation', 'conflict', 'retry', 'success', 'not-found'],
		selector: `route-${input.id.replaceAll('.', '-')}`,
		status: 'active',
		guarantees: [],
		...input,
	} });
}

export const ADMIN_ROUTES: readonly SiteRouteContribution[] = validateRouteCapabilities([
	adminRoute('/404', 'pages/404.astro', { id: 'admin.system.not-found', description: 'Admin-owned themed not-found response for authenticated and public routes.', archetype: 'message', template: 'MessageTemplate', surface: 'system', resourceType: 'route-error', accessPolicy: ['anonymous or signed-in principal'], navigation: 'hidden', states: ['not-found'] }),
	adminRoute('/500', 'pages/500.astro', { id: 'admin.system.error', description: 'Admin-owned themed unavailable response for authenticated and public routes.', archetype: 'message', template: 'MessageTemplate', surface: 'system', resourceType: 'route-error', accessPolicy: ['anonymous or signed-in principal'], navigation: 'hidden', states: ['unavailable', 'retry'] }),
	adminRoute('/app', 'pages/app/index.astro', { id: 'admin.app.start', description: 'Authenticated identity and active-team start dashboard.', guarantees: ['guarantee.user.auth.user-login.004', 'guarantee.team.team.switch-active-team.013'] }),
	adminRoute('/app/account', 'pages/app/account/index.astro', { id: 'admin.account.identity', description: 'Identity, immutable username, verified email, password, and connected-provider settings.', guarantees: ['guarantee.user.account.edit-account-settings.006'], knowledgePageIds: ['account.identity'] }),
	adminRoute('/app/account/sessions', 'pages/app/account/sessions.astro', { id: 'admin.account.sessions', description: 'Account session collection with current-session protection and revocation.', guarantees: ['guarantee.user.account.manage-sessions.007'], knowledgePageIds: ['account.sessions'] }),
	adminRoute('/app/account/notifications', 'pages/app/account/notifications.astro', { id: 'admin.account.notifications', description: 'Global and per-project content notification preferences and email cadence.', guarantees: ['guarantee.user.account.manage-notifications.008'], knowledgePageIds: ['account.notifications'] }),
	adminRoute('/app/account/appearance', 'pages/app/account/appearance.astro', { id: 'admin.account.appearance', description: 'Personal theme creation and management; activation remains in the shell selector.', guarantees: ['guarantee.user.account.manage-appearance.009'], knowledgePageIds: ['account.appearance'] }),
	adminRoute('/app/account/delete', 'pages/app/account/delete.astro', { id: 'admin.account.delete', description: 'Blocked, reauthenticated, exact-confirmation account deletion.', guarantees: ['guarantee.user.account.delete-user.011'], knowledgePageIds: ['account.deletion'] }),
	adminRoute('/app/teams', 'pages/app/teams/index.astro', { id: 'admin.team.collection', description: 'Teams available to the principal and active-team selection.', guarantees: ['guarantee.team.team.switch-active-team.013'], knowledgePageIds: ['teams.collection'] }),
	adminRoute('/app/teams/active', 'pages/app/teams/active.ts', { id: 'admin.team.active', description: 'Explicit, membership-validated active-team preference selection.', responseKind: 'action', archetype: 'action', navigation: 'hidden', guarantees: ['guarantee.team.team.switch-active-team.013'] }),
	adminRoute('/app/teams/new', 'pages/app/teams/new.astro', { id: 'admin.team.create', description: 'Authenticated team creation.', guarantees: ['guarantee.team.team.create-team.012'], knowledgePageIds: ['team.creation'] }),
	adminRoute('/app/teams/[teamId]', 'pages/app/teams/[teamId]/index.astro', { id: 'admin.team.overview', description: 'Authenticated operational team overview with bounded domain summaries and recent audit activity.', guarantees: ['guarantee.team.team.view-team-overview.015'], knowledgePageIds: ['team.overview'] }),
	adminRoute('/app/teams/[teamId]/edit', 'pages/app/teams/[teamId]/edit.astro', { id: 'admin.team.edit', description: 'Authorized team identity settings.', guarantees: ['guarantee.team.team.edit-team-settings.014'], knowledgePageIds: ['team.settings'] }),
	adminRoute('/app/teams/[teamId]/delete', 'pages/app/teams/[teamId]/delete.astro', { id: 'admin.team.delete', description: 'Authorized, blocker-aware team deletion.', guarantees: ['guarantee.team.team.delete-team.016'], knowledgePageIds: ['team.lifecycle'] }),
	adminRoute('/app/teams/[teamId]/members', 'pages/app/teams/[teamId]/members.astro', { id: 'admin.team.members', description: 'Team membership, invitation, role, and removal operations.', guarantees: ['guarantee.team.membership.invite-team-members.017', 'guarantee.team.membership.change-member-role.019', 'guarantee.team.membership.remove-team-member.020'], knowledgePageIds: ['team.membership'] }),
	adminRoute('/app/services', 'pages/app/services/index.astro', { id: 'admin.services.collection', description: 'Active-team provider connections and capability availability.', guarantees: ['guarantee.service.connection.service-management-production-readiness.026'], knowledgePageIds: ['services.connections'] }),
	adminRoute('/app/services/new', 'pages/app/services/new.astro', { id: 'admin.services.create', description: 'Provider-first service connection wizard.', guarantees: ['guarantee.service.connection.connect-service.023'], knowledgePageIds: ['services.connect'] }),
	adminRoute('/app/services/vault', 'pages/app/services/vault.astro', { id: 'admin.services.vault', description: 'Personal administrator key and team vault custody management.', guarantees: ['guarantee.service.vault.initialize-personal-vault.021', 'guarantee.service.vault.recover-vault-access.022'], knowledgePageIds: ['vault.overview'] }),
	adminRoute('/app/services/[connectionId]', 'pages/app/services/[connectionId].astro', { id: 'admin.services.detail', description: 'Provider connection, capabilities, encrypted credentials, activity, and settings.', guarantees: ['guarantee.service.connection.edit-service.024', 'guarantee.service.connection.disconnect-service.025'], knowledgePageIds: ['services.connection'] }),
	adminRoute('/app/feedback', 'pages/app/feedback/index.astro', { id: 'admin.feedback.collection', description: 'Platform-administrator feedback search, triage, and privacy-safe export.', accessPolicy: ['platform_admin'], guarantees: ['guarantee.admin.feedback.manage-feedback.030'], knowledgePageIds: ['feedback.administration'] }),
	adminRoute('/app/feedback/[feedbackId]', 'pages/app/feedback/[feedbackId].astro', { id: 'admin.feedback.detail', description: 'Private feedback context, attachment, timeline, and resolution workflow.', accessPolicy: ['platform_admin'], guarantees: ['guarantee.admin.feedback.manage-feedback.030'], knowledgePageIds: ['feedback.triage'] }),
	adminRoute('/app/focus', 'pages/app/focus/index.astro', { id: 'admin.focus.overview', description: 'Stable team research and governance snapshot.', guarantees: ['guarantee.work.focus.enter-focus-mode.031'] }),
	adminRoute('/app/focus/questions', 'pages/app/focus/questions.astro', { id: 'admin.focus.questions', description: 'Evidence-centered question queue and answer controls.', guarantees: ['guarantee.work.focus.review-governance.032'] }),
	adminRoute('/app/focus/proposals', 'pages/app/focus/proposals/index.astro', { id: 'admin.focus.proposals', description: 'Governance proposal pipeline and creation surface.', guarantees: ['guarantee.work.focus.review-governance.032'] }),
	adminRoute('/app/focus/proposals/[proposalId]', 'pages/app/focus/proposals/[proposalId].astro', { id: 'admin.focus.proposal', description: 'Single-proposal deliberation chamber and authorized governance controls.', guarantees: ['guarantee.work.focus.review-governance.032'] }),
	adminRoute('/app/focus/decisions', 'pages/app/focus/decisions.astro', { id: 'admin.focus.decisions', description: 'Decision record with planning and execution consequences.', guarantees: ['guarantee.work.focus.review-governance.032'] }),
	adminRoute('/app/command', 'pages/app/command/index.astro', { id: 'admin.command.overview', description: 'Situational command overview and live agent activity timeline.', guarantees: ['guarantee.work.command.monitor-team-operations.033'] }),
	adminRoute('/app/command/agents', 'pages/app/command/agents/index.astro', { id: 'admin.command.agents', description: 'Portfolio agent roster grouped by project and activity.', guarantees: ['guarantee.work.command.monitor-team-operations.033'] }),
	adminRoute('/app/command/assignments/[assignmentId]', 'pages/app/command/assignments/[assignmentId].astro', { id: 'admin.command.assignment', description: 'Durable assignment evidence and existing recovery controls.', guarantees: ['guarantee.work.command.inspect-assignment.034'] }),
	adminRoute('/app/projects', 'pages/app/projects/index.astro', { id: 'admin.domain.projects', description: 'Active-team project command portfolio.', guarantees: ['guarantee.team.team.view-team-overview.015'] }),
	adminRoute('/app/projects/[projectId]', 'pages/app/projects/[projectId]/index.astro', { id: 'admin.projects.command', description: 'Project command overview across approvals, releases, capacity, agents, and repository state.', guarantees: ['guarantee.work.command.monitor-team-operations.033'] }),
	adminRoute('/app/projects/[projectId]/agents', 'pages/app/projects/[projectId]/agents/index.astro', { id: 'admin.projects.agents', description: 'Project agent roster and recent activity.', guarantees: ['guarantee.work.command.monitor-team-operations.033'] }),
	adminRoute('/app/projects/[projectId]/agents/[agentId]', 'pages/app/projects/[projectId]/agents/[agentId].astro', { id: 'admin.projects.agent-studio', description: 'Read-only Agent Studio with execution and TreeDX trace evidence.', guarantees: ['guarantee.work.command.inspect-assignment.034'] }),
	adminRoute('/app/projects/[projectId]/books', 'pages/app/projects/[projectId]/books/index.astro', { id: 'admin.knowledge.project-books', description: 'Project-scoped repository-native book management.', guarantees: ['guarantee.project.book.create-book.065', 'guarantee.project.book.edit-book.066', 'guarantee.project.book.delete-book.067', 'guarantee.project.book.search-books.068'], knowledgePageIds: ['knowledge.authoring'] }),
	adminRoute('/app/projects/[projectId]/workflows', 'pages/app/projects/[projectId]/workflows.astro', { id: 'admin.projects.workflows', description: 'Project repository binding, remote workflow operation, secret, and variable administration.', guarantees: [], knowledgePageIds: ['services.workflow-execution', 'services.workflow-configuration'] }),
	adminRoute('/app/capacity', 'pages/app/capacity/index.astro', { id: 'admin.domain.capacity', description: 'Provider availability, reservations, usage, routing, and ledger.', guarantees: ['guarantee.work.command.monitor-team-operations.033'] }),
	adminRoute('/app/work', 'pages/app/work/index.astro', { id: 'admin.agent-lab.monitor', description: 'Team Agent Lab monitoring foundation and workday control.', guarantees: ['guarantee.work.command.monitor-team-operations.033', 'guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/inbox', 'pages/app/work/inbox/index.astro', { id: 'admin.agent-lab.inbox', description: 'Agent Lab proposals and operational errors.' }),
	adminRoute('/app/work/decisions', 'pages/app/work/decisions/index.astro', { id: 'admin.agent-lab.decisions', description: 'Agent Lab proposals, decisions, assignments, and outcomes.' }),
	adminRoute('/app/work/build', 'pages/app/work/build/index.astro', { id: 'admin.agent-lab.build', description: 'Agent design and simulation entry surface.' }),
	adminRoute('/app/work/direction', 'pages/app/work/direction/index.astro', { id: 'admin.agent-lab.direction', description: 'Assignment and execution direction timeline.' }),
	adminRoute('/app/work/results', 'pages/app/work/results/index.astro', { id: 'admin.agent-lab.results', description: 'Agent artifacts, summaries, and reports.' }),
	adminRoute('/app/work/find', 'pages/app/work/find/index.astro', { id: 'admin.agent-lab.find', description: 'Cross-entity Agent Lab search.' }),
	adminRoute('/app/work/agents', 'pages/app/work/agents/index.astro', { id: 'admin.agent-lab.agents', description: 'Configured and active Agent Lab agent summaries.', guarantees: ['guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/workdays', 'pages/app/work/workdays/index.astro', { id: 'admin.agent-lab.workdays', description: 'Operating-day workday summaries.', guarantees: ['guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/events', 'pages/app/work/events/index.astro', { id: 'admin.agent-lab.events', description: 'Durable Agent Lab system-event summaries.', guarantees: ['guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/assignments', 'pages/app/work/assignments/index.astro', { id: 'admin.agent-lab.assignments', description: 'Operating-day assignment summaries.', guarantees: ['guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/executions', 'pages/app/work/executions/index.astro', { id: 'admin.agent-lab.executions', description: 'Native execution-attempt summaries.', guarantees: ['guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/artifacts', 'pages/app/work/artifacts/index.astro', { id: 'admin.agent-lab.artifacts', description: 'Durable Agent Lab artifact summaries.', guarantees: ['guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/work/[runId]', 'pages/app/work/[runId].astro', { id: 'admin.work.detail', description: 'Live workday control or historical race replay.', guarantees: ['guarantee.work.command.monitor-team-operations.033', 'guarantee.work.agent-lab.monitor-agent-lab.035'] }),
	adminRoute('/app/knowledge', 'pages/app/knowledge/index.astro', { id: 'admin.knowledge.workbench', description: 'Active-team repository-native book authoring, review, linking, and pack workbench.', guarantees: ['guarantee.project.book.create-book.065', 'guarantee.project.book.edit-book.066', 'guarantee.project.book.delete-book.067', 'guarantee.project.book.search-books.068', 'guarantee.project.knowledge.create-book-page.069', 'guarantee.project.book.download-book.070', 'guarantee.project.knowledge.edit-book-page.071', 'guarantee.project.knowledge.delete-book-page.072', 'guarantee.project.library.download-library.073', 'guarantee.project.library.rebuild-library-index.090', 'guarantee.project.knowledge.review-backlinks.091'], knowledgePageIds: ['knowledge.authoring'] }),
	adminRoute('/app/knowledge/packs/[buildId]/download', 'pages/app/knowledge/packs/[buildId]/download.ts', { id: 'admin.knowledge.pack-download', description: 'Authorized no-store knowledge-pack artifact download.', responseKind: 'data', archetype: 'action', navigation: 'hidden', guarantees: ['guarantee.project.book.download-book.070', 'guarantee.project.library.download-library.073'] }),
	adminRoute('/app/market', 'pages/app/market/index.astro', { id: 'admin.domain.market', description: 'Bounded active-team catalog and billing domain landing page.', guarantees: ['guarantee.team.team.view-team-overview.015'] }),
	adminRoute('/auth/register', 'pages/auth/register.astro', { id: 'admin.auth.register', description: 'Credential registration with username/email availability and immutable username disclosure.', guarantees: ['guarantee.user.auth.register-user.001'] }),
	adminRoute('/auth/check-email', 'pages/auth/check-email.astro', { id: 'admin.auth.check-email', description: 'Hidden verification/reset check-inbox continuation.', archetype: 'message', template: 'MessageTemplate' }),
	adminRoute('/auth/confirm-email', 'pages/auth/confirm-email.astro', {
		id: 'admin.auth.confirm-email',
		description: 'Email-confirmation token result and recovery for registration and signed-in account email management.',
		archetype: 'message',
		accessPolicy: ['valid one-time confirmation token', 'anonymous or signed-in principal', 'safe return URL'],
		guarantees: ['guarantee.user.auth.verify-email.002', 'guarantee.user.account.edit-account-settings.006'],
	}),
	adminRoute('/auth/sign-in', 'pages/auth/sign-in.astro', { id: 'admin.auth.sign-in', description: 'OAuth and configured-provider sign-in entry.', guarantees: ['guarantee.user.auth.user-login.004'] }),
	adminRoute('/auth/logout', 'pages/auth/logout.ts', { id: 'admin.auth.logout', description: 'CSRF-safe POST session termination; non-mutating GET redirect.', responseKind: 'redirect', archetype: 'redirect', accessPolicy: ['GET is non-mutating', 'POST requires signed-in session and double-submit CSRF'], guarantees: ['guarantee.user.auth.user-logout.005'] }),
	adminRoute('/auth/forgot-password', 'pages/auth/forgot-password.astro', { id: 'admin.auth.forgot-password', description: 'Privacy-safe password-reset request.' }),
	adminRoute('/auth/reset-password', 'pages/auth/reset-password.astro', { id: 'admin.auth.reset-password', description: 'Token-bound password reset.', guarantees: ['guarantee.user.auth.forgot-reset-password.003'] }),
	adminRoute('/auth/username', 'pages/auth/username.astro', { id: 'admin.auth.username-claim', description: 'Permanent username claim for first-time provider users.', accessPolicy: ['restricted provider-onboarding session', 'username not already assigned', 'safe return URL'] }),
	adminRoute('/auth/authorize', 'pages/auth/authorize.astro', {
		id: 'admin.auth.authorize',
		description: 'OAuth client and scope review with explicit approval or denial.',
		accessPolicy: ['valid authorization request', 'signed-in principal or credential authentication', 'exact registered redirect URI'],
	}),
	adminRoute('/auth/device/approve', 'pages/auth/device/approve.astro', { id: 'admin.auth.device-approve', description: 'Authenticated CLI/device authorization approval.', accessPolicy: ['signed-in principal', 'valid pending device request'] }),
	adminRoute('/auth/callback/[provider]', 'pages/auth/callback/[provider].ts', { id: 'admin.auth.provider-callback', description: 'Hidden configured-provider callback with one-time state, nonce, PKCE, and safe redirect.', responseKind: 'redirect', archetype: 'redirect', accessPolicy: ['anonymous principal only', 'configured provider', 'one-time database state', 'nonce and PKCE validation', 'safe return URL'] }),
	adminRoute('/u/[username]', 'pages/u/[username].astro', { id: 'admin.profile.user', description: 'Public identity-only user profile.', guarantees: ['guarantee.user.account.view-user-profile.010'] }),
	adminRoute('/t/[name]', 'pages/t/[name].astro', { id: 'admin.profile.team', description: 'Public identity-only team profile.', guarantees: ['guarantee.team.team.view-public-team-profile.021'] }),
	adminRoute('/team-invites/[token]/accept', 'pages/team-invites/[token]/accept.astro', { id: 'admin.team.invite-accept', description: 'Idempotent invitation acceptance and safe destination.', guarantees: ['guarantee.team.membership.accept-team-invitation.018'], knowledgePageIds: ['team.invitation'] }),
	adminRoute('/healthz', 'pages/healthz.ts', {
		id: 'admin.system.health',
		description: 'Stateless managed-runtime readiness endpoint.',
		responseKind: 'data', archetype: 'action', shell: 'Standalone', template: 'Standalone', surface: 'system', resourceType: 'health',
		accessPolicy: ['public readiness probe'], navigation: 'hidden', states: ['success', 'unavailable'],
	}),
]);

export const ADMIN_SUPPORT_ROUTES: readonly SiteRouteContribution[] = validateRouteCapabilities([
	adminRoute('/v1/[...all]', 'pages/v1/[...all].ts', {
		id: 'admin.support.api-proxy',
		description: 'Same-origin authenticated API facade with double-submit CSRF enforcement.',
		responseKind: 'proxy', archetype: 'action', shell: 'Standalone', template: 'Standalone', surface: 'system', resourceType: 'api-proxy',
		accessPolicy: ['target API policy', 'double-submit CSRF for cookie-authenticated mutation'], navigation: 'hidden',
	}),
]);

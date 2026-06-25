import type { DashboardViewModel, FeedbackContext, HelpContext, ResolvedAction } from '@treeseed/ui';
import { compact, describeState, safeArray, teamLabel, toneForState, type OperationalContext } from './shared.js';

type DashboardBundle = {
	viewModel: DashboardViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
};

function displayName(value: any, fallback: string) {
	return compact(value?.displayName, compact(value?.name, compact(value?.title, compact(value?.slug, fallback))));
}

function countLabel(value: number, singular: string, plural = `${singular}s`) {
	return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

function feedbackContext(input: {
	url: string;
	title: string;
	shell: 'public' | 'product';
	context: FeedbackContext['context'];
	routePattern: string;
	teamId?: string;
	projectId?: string;
	resourceType?: string;
	allowAnonymous?: boolean;
}): FeedbackContext {
	const policy = input.allowAnonymous
		? 'public'
		: input.context === 'project'
			? 'project'
			: input.context === 'team'
				? 'team'
				: input.context === 'admin'
					? 'admin'
					: 'authenticated';
	return {
		url: input.url,
		canonicalPath: input.routePattern,
		title: input.title,
		shell: input.shell,
		context: input.context,
		teamId: input.teamId,
		projectId: input.projectId,
		resourceType: input.resourceType,
		submissionEndpoint: input.shell === 'public' ? '/api/feedback/submit' : '/v1/feedback',
		allowAnonymous: input.allowAnonymous ?? false,
		screenshotPolicy: 'optional',
		attachmentStoragePolicy: input.context === 'public' || input.context === 'market' ? 'public' : 'private',
		routePattern: input.routePattern,
		policy,
	};
}

function helpContext(input: {
	title: string;
	shell: 'public' | 'product';
	context: HelpContext['context'];
	routePattern: string;
	template: HelpContext['template'];
	topicId: string;
	summary: string;
	resourceType?: string;
	teamId?: string;
	projectId?: string;
	feedbackType?: HelpContext['feedbackType'];
}): HelpContext {
	return {
		topicIds: [input.topicId],
		shell: input.shell,
		context: input.context,
		resourceType: input.resourceType,
		routePattern: input.routePattern,
		canonicalPath: input.routePattern,
		template: input.template,
		summary: input.summary,
		topics: [{
			id: input.topicId,
			title: input.title,
			summary: input.summary,
			visibility: input.shell === 'public' ? 'public' : input.context === 'project' ? 'project' : 'team',
			source: 'capability',
		}],
		relatedDocs: [{
			topicId: input.topicId,
			title: input.title,
			href: input.routePattern,
			visibility: input.shell === 'public' ? 'public' : input.context === 'project' ? 'project' : 'team',
			summary: input.summary,
			source: 'capability',
			current: true,
		}],
		relatedActions: [],
		searchScope: input.shell === 'public' ? 'public' : input.context === 'project' ? 'project' : 'team',
		searchPlaceholder: `Search ${input.title.toLowerCase()} help`,
		visibility: input.shell === 'public' ? 'public' : input.context === 'project' ? 'project' : 'team',
		feedbackType: input.feedbackType ?? 'question',
	};
}

export async function buildPersonalDashboard(context: OperationalContext, url: URL): Promise<DashboardBundle> {
	const activeTeam = context.activeTeam;
	const projectCount = context.projects.length;
	const hostCount = activeTeam && context.store?.listTeamWebHosts
		? safeArray(await context.store.listTeamWebHosts(activeTeam.id).catch(() => [])).length
		: 0;
	const providerCount = activeTeam && context.store?.listTeamCapacityProviders
		? safeArray(await context.store.listTeamCapacityProviders(activeTeam.id).catch(() => [])).length
		: 0;
	const productCount = activeTeam && context.store?.listTeamProducts
		? safeArray(await context.store.listTeamProducts(activeTeam.id, context.principal).catch(() => [])).length
		: 0;
	const actions: ResolvedAction[] = [
		{ id: 'team.create', label: 'New team', state: 'allowed', href: '/app/teams/new' },
		{ id: 'project.create', label: 'New project', state: activeTeam ? 'allowed' : 'requiresSetup', href: '/app/projects/new', reason: activeTeam ? undefined : 'Create a team before creating a project.' },
	];

	return {
		viewModel: {
			title: 'Personal dashboard',
			description: 'Your current TreeSeed context, next actions, and recent operating surface.',
			context: {
				id: 'personal-context',
				title: 'Where you are',
				description: 'Signed-in scope and active team.',
				items: [
					{ label: 'Principal', value: displayName(context.principal, 'Signed-in user'), description: compact(context.principal?.email, 'Authenticated') },
					{ label: 'Active team', value: activeTeam ? teamLabel(activeTeam) : 'None', description: activeTeam ? 'Team-scoped controls are available' : 'Create or join a team', tone: activeTeam ? 'success' : 'warning' },
					{ label: 'Projects', value: projectCount, description: countLabel(projectCount, 'project'), href: '/app/projects' },
				],
			},
			status: {
				id: 'personal-status',
				title: 'Status summary',
				description: 'Immediate readiness across your active context.',
				items: [
					{ label: 'Services', value: hostCount, description: 'Connected host credentials', href: '/app/services', tone: hostCount > 0 ? 'success' : 'warning' },
					{ label: 'Capacity', value: providerCount, description: 'Provider records', href: '/app/capacity/providers', tone: providerCount > 0 ? 'success' : 'warning' },
					{ label: 'Saved assets', value: productCount, description: 'Team resources and imports', href: '/app/knowledge/artifacts' },
				],
			},
			setup: {
				id: 'personal-setup',
				title: 'Setup progress',
				description: 'The shortest path to a useful platform context.',
				items: [
					{ label: 'Team', value: activeTeam ? 'Ready' : 'Needed', href: '/app/teams', tone: activeTeam ? 'success' : 'warning' },
					{ label: 'Project', value: projectCount > 0 ? 'Ready' : 'Needed', href: '/app/projects', tone: projectCount > 0 ? 'success' : 'warning' },
					{ label: 'Questions', value: 'Open', href: '/app/work/questions', description: 'Capture direction for work' },
				],
			},
			nextActions: [
				activeTeam
					? { id: 'new-project', title: 'Create or review a project', description: 'Project dashboards summarize knowledge, deployment, and workday readiness.', href: '/app/projects', status: 'Recommended' }
					: { id: 'new-team', title: 'Create your first team', description: 'Teams own projects, hosts, capacity, and private Knowledge Hubs.', href: '/app/teams/new', status: 'Required' },
				{ id: 'services', title: 'Review service readiness', description: 'Check hosts, capacity providers, credentials, diagnostics, and recovery paths.', href: '/app/services', status: 'Services' },
				{ id: 'questions', title: 'Review project questions', description: 'Questions are the canonical project-direction proof route.', href: '/app/work/questions', status: 'Phase 2' },
			],
			primaryResources: context.projects.slice(0, 4).map((project: any) => ({
				id: compact(project?.id, compact(project?.slug, 'project')),
				title: displayName(project, 'Project'),
				description: compact(project?.profileSummary, compact(project?.description, 'Project operating context')),
				href: `/app/projects/${encodeURIComponent(compact(project?.id, compact(project?.slug, 'project')))}`,
				status: describeState(project?.status, 'active'),
			})),
			activity: [
				{ id: 'personal-context-loaded', title: 'Dashboard context loaded', description: activeTeam ? `Active team is ${teamLabel(activeTeam)}.` : 'No active team selected.', tone: activeTeam ? 'success' : 'warning' },
			],
		},
		actions,
		helpContext: helpContext({ title: 'Personal dashboard', shell: 'product', context: 'personal', routePattern: '/app/', template: 'dashboard', topicId: 'personal-dashboard', summary: 'Use the personal dashboard to orient across teams, projects, notifications, and next actions.' }),
		feedbackContext: feedbackContext({ url: url.href, title: 'Personal dashboard', shell: 'product', context: 'personal', routePattern: '/app/' }),
	};
}

export async function buildTeamDashboard(context: OperationalContext, url: URL): Promise<DashboardBundle> {
	const activeTeam = context.activeTeam;
	const members = activeTeam && context.store?.listTeamMembers ? safeArray(await context.store.listTeamMembers(activeTeam.id).catch(() => [])) : [];
	const invites = activeTeam && context.store?.listTeamInvites ? safeArray(await context.store.listTeamInvites(activeTeam.id).catch(() => [])) : [];
	const providers = activeTeam && context.store?.listTeamCapacityProviders ? safeArray(await context.store.listTeamCapacityProviders(activeTeam.id).catch(() => [])) : [];
	const actions: ResolvedAction[] = [
		{ id: 'team.create', label: 'New team', state: 'allowed', href: '/app/teams/new' },
		{ id: 'project.create', label: 'New project', state: activeTeam ? 'allowed' : 'requiresSetup', href: '/app/projects/new', reason: activeTeam ? undefined : 'Select or create a team first.' },
	];

	return {
		viewModel: {
			title: 'Team dashboard',
			description: 'Team membership, project portfolio, allocation, setup, and recent operating context.',
			context: {
				id: 'team-context',
				title: 'Where you are',
				description: 'The active organization context for shared work.',
				items: [
					{ label: 'Active team', value: activeTeam ? teamLabel(activeTeam) : 'None', description: activeTeam ? compact(activeTeam?.profileSummary, 'Team selected') : 'Create a team to continue', tone: activeTeam ? 'success' : 'warning' },
					{ label: 'Available teams', value: context.teams.length, description: countLabel(context.teams.length, 'team') },
					{ label: 'Projects', value: context.projects.length, description: countLabel(context.projects.length, 'project'), href: '/app/projects' },
				],
			},
			status: {
				id: 'team-status',
				title: 'Status summary',
				items: [
					{ label: 'Members', value: members.length, description: countLabel(members.length, 'member'), href: activeTeam ? `/app/teams/${encodeURIComponent(activeTeam.id)}/members` : undefined },
					{ label: 'Invites', value: invites.length, description: 'Pending invitations', href: activeTeam ? `/app/teams/${encodeURIComponent(activeTeam.id)}/members` : undefined },
					{ label: 'Capacity providers', value: providers.length, description: 'Team-owned providers', href: '/app/capacity/providers', tone: providers.length > 0 ? 'success' : 'warning' },
				],
			},
			allocation: {
				id: 'team-allocation',
				title: 'Portfolio allocation',
				description: 'Project and capacity distribution for the selected team.',
				items: [
					{ label: 'Project portfolio', value: context.projects.length, description: 'Active project contexts', href: '/app/projects' },
					{ label: 'Capacity policy', value: providers.length > 0 ? 'Configured' : 'Needs setup', href: '/app/capacity/allocation', tone: providers.length > 0 ? 'success' : 'warning' },
				],
			},
			nextActions: [
				activeTeam
					? { id: 'team-members', title: 'Review members and invites', description: 'Keep team access aligned with current project work.', href: `/app/teams/${encodeURIComponent(activeTeam.id)}/members`, status: 'Team' }
					: { id: 'team-new', title: 'Create a team', description: 'A team is required before projects, hosts, and private readers.', href: '/app/teams/new', status: 'Required' },
				{ id: 'team-projects', title: 'Open project portfolio', description: 'Move from team context to project dashboards.', href: '/app/projects', status: 'Projects' },
			],
			primaryResources: context.teams.map((team: any) => ({
				id: compact(team?.id, compact(team?.slug, 'team')),
				title: teamLabel(team),
				description: compact(team?.profileSummary, compact(team?.slug, 'Team context')),
				href: `/t/${encodeURIComponent(compact(team?.name, compact(team?.slug, compact(team?.id, 'team'))))}`,
				status: team?.id === activeTeam?.id ? 'Active' : 'Available',
			})),
			activity: [{ id: 'team-context-loaded', title: 'Team dashboard loaded', description: activeTeam ? `${teamLabel(activeTeam)} is active.` : 'No active team selected.', tone: activeTeam ? 'success' : 'warning' }],
		},
		actions,
		helpContext: helpContext({ title: 'Team dashboard', shell: 'product', context: 'team', routePattern: '/app/teams', template: 'dashboard', topicId: 'team-dashboard', summary: 'Use the team dashboard to review members, portfolio allocation, setup, and team-scoped next actions.' }),
		feedbackContext: feedbackContext({ url: url.href, title: 'Team dashboard', shell: 'product', context: 'team', routePattern: '/app/teams', teamId: activeTeam?.id }),
	};
}

export async function buildProjectDashboard(context: OperationalContext, project: any, details: any, team: any, url: URL): Promise<DashboardBundle> {
	const projectId = compact(project?.id, compact(project?.slug, 'project'));
	const deployments = context.store?.listProjectDeployments ? safeArray(await context.store.listProjectDeployments(projectId, { limit: 5 }).catch(() => [])) : [];
	const workdays = context.store?.listProjectWorkdaySummaries ? safeArray(await context.store.listProjectWorkdaySummaries(projectId, null).catch(() => [])) : [];
	const artifacts = context.store?.listCatalogArtifactVersions ? safeArray(await context.store.listCatalogArtifactVersions(projectId).catch(() => [])) : [];
	const questionsHref = '/app/work/questions';
	const actions: ResolvedAction[] = [
		{ id: 'project.settings', label: 'Settings', state: 'allowed', href: `/app/projects/${encodeURIComponent(projectId)}/settings` },
		{ id: 'project.questions', label: 'Questions', state: 'allowed', href: questionsHref },
	];

	return {
		viewModel: {
			title: `${displayName(project, 'Project')} dashboard`,
			description: 'Project readiness, Knowledge Hub access, deployment state, workdays, and next actions.',
			context: {
				id: 'project-context',
				title: 'Where you are',
				items: [
					{ label: 'Project', value: displayName(project, 'Project'), description: compact(project?.slug, projectId) },
					{ label: 'Team', value: teamLabel(team), description: 'Owning team', href: '/app/teams' },
					{ label: 'Visibility', value: describeState(project?.visibility, 'private'), description: 'Project sharing state' },
				],
			},
			status: {
				id: 'project-status',
				title: 'Status summary',
				description: 'Readiness across the most important project systems.',
				items: [
					{ label: 'Project state', value: describeState(project?.status, 'active'), tone: toneForState(project?.status) as any },
					{ label: 'Deployments', value: deployments.length, description: 'Recent deployment records', href: `/app/projects/${encodeURIComponent(projectId)}/deploy`, tone: deployments.length > 0 ? 'success' : 'warning' },
					{ label: 'Workdays', value: workdays.length, description: 'Recorded project workdays', href: `/app/projects/${encodeURIComponent(projectId)}/workdays` },
				],
			},
			deployment: {
				id: 'project-deployment',
				title: 'Deployment and runtime',
				description: 'Public runtime, private Knowledge Hub, and content state.',
				items: [
					{ label: 'Knowledge Hub', value: 'Available', description: 'Private reader route is active', href: `/app/projects/${encodeURIComponent(projectId)}/knowledge`, tone: 'success' },
					{ label: 'Public reader', value: 'Phase 3', description: 'R2-backed /knowledge proof route', href: '/knowledge', tone: 'success' },
					{ label: 'Artifacts', value: artifacts.length, description: 'Catalog artifact versions', href: `/app/projects/${encodeURIComponent(projectId)}/artifacts` },
				],
			},
			setup: {
				id: 'project-setup',
				title: 'Setup progress',
				items: [
					{ label: 'Settings', value: details ? 'Loaded' : 'Minimal', href: `/app/projects/${encodeURIComponent(projectId)}/settings`, tone: details ? 'success' : 'warning' },
					{ label: 'Questions', value: 'Ready', href: questionsHref, tone: 'success' },
					{ label: 'Help and feedback', value: 'Ready', description: 'Shell-level Phase 5/6 surfaces', tone: 'success' },
				],
			},
			nextActions: [
				{ id: 'project-questions', title: 'Review project questions', description: 'Resolve uncertainty before workday execution.', href: questionsHref, status: 'Direction' },
				{ id: 'project-knowledge', title: 'Open private Knowledge Hub', description: 'Read private project content through the Phase 4 reader.', href: `/app/projects/${encodeURIComponent(projectId)}/knowledge`, status: 'Private' },
				{ id: 'project-deploy', title: 'Review deployment state', description: 'Check readiness and recent deployment events.', href: `/app/projects/${encodeURIComponent(projectId)}/deploy`, status: 'Runtime' },
			],
			primaryResources: [
				{ id: 'settings', title: 'Settings', description: 'Project profile, hosts, and configuration.', href: `/app/projects/${encodeURIComponent(projectId)}/settings`, status: 'Project' },
				{ id: 'workdays', title: 'Workdays', description: 'Project workday history and requests.', href: `/app/projects/${encodeURIComponent(projectId)}/workdays`, status: countLabel(workdays.length, 'record') },
				{ id: 'artifacts', title: 'Artifacts', description: 'Generated and cataloged knowledge outputs.', href: `/app/projects/${encodeURIComponent(projectId)}/artifacts`, status: countLabel(artifacts.length, 'artifact') },
			],
			activity: [
				...deployments.slice(0, 3).map((deployment: any, index: number) => ({
					id: `deployment-${compact(deployment?.id, String(index))}`,
					title: compact(deployment?.title, 'Deployment updated'),
					description: describeState(deployment?.status ?? deployment?.state, 'recorded'),
					timestamp: compact(deployment?.updatedAt, compact(deployment?.createdAt, '')),
					href: `/app/projects/${encodeURIComponent(projectId)}/deploy`,
					tone: toneForState(deployment?.status ?? deployment?.state) as any,
				})),
				...workdays.slice(0, 2).map((workday: any, index: number) => ({
					id: `workday-${compact(workday?.id, String(index))}`,
					title: compact(workday?.summary?.objective, 'Workday recorded'),
					description: describeState(workday?.state, 'active'),
					timestamp: compact(workday?.updatedAt, compact(workday?.createdAt, '')),
					href: `/app/projects/${encodeURIComponent(projectId)}/workdays`,
					tone: toneForState(workday?.state) as any,
				})),
			],
		},
		actions,
		helpContext: helpContext({ title: 'Project dashboard', shell: 'product', context: 'project', routePattern: '/app/projects/[projectId]', template: 'dashboard', topicId: 'project-dashboard', summary: 'Use the project dashboard to review project readiness, Knowledge Hub state, deployment evidence, and next actions.', resourceType: 'project', projectId }),
		feedbackContext: feedbackContext({ url: url.href, title: 'Project dashboard', shell: 'product', context: 'project', routePattern: '/app/projects/[projectId]', teamId: team?.id, projectId, resourceType: 'project' }),
	};
}

export function buildMarketDashboard(input: { url: URL; templates: any[]; knowledgePacks: any[]; principal?: any | null }): DashboardBundle {
	const templateCount = input.templates.length;
	const packCount = input.knowledgePacks.length;
	const actions: ResolvedAction[] = [
		{ id: 'market.templates', label: 'Workflow imports', state: 'allowed', href: '/market/templates/' },
		{ id: 'market.knowledge', label: 'Knowledge imports', state: 'allowed', href: '/market/knowledge-packs/' },
	];
	return {
		viewModel: {
			title: 'Market dashboard',
			description: 'Discover workflow imports, knowledge packs, entitlement context, and install paths.',
			context: {
				id: 'market-context',
				title: 'Where you are',
				items: [
					{ label: 'Surface', value: 'Market', description: 'Public acquisition and import context', tone: 'info' },
					{ label: 'Signed in', value: input.principal ? 'Yes' : 'No', description: input.principal ? 'Install actions can use account context' : 'Sign in before private installs' },
				],
			},
			status: {
				id: 'market-status',
				title: 'Discovery summary',
				items: [
					{ label: 'Workflow imports', value: templateCount, description: countLabel(templateCount, 'template'), href: '/market/templates/' },
					{ label: 'Knowledge imports', value: packCount, description: countLabel(packCount, 'pack'), href: '/market/knowledge-packs/' },
					{ label: 'Seller state', value: input.principal ? 'Available later' : 'Sign-in required', description: 'Seller dashboard is deferred until seller routes exist' },
				],
			},
			nextActions: [
				{ id: 'browse-templates', title: 'Browse workflow imports', description: 'Start from a proven operational baseline.', href: '/market/templates/', status: 'Templates' },
				{ id: 'browse-knowledge', title: 'Browse knowledge imports', description: 'Install reusable Knowledge Hub material.', href: '/market/knowledge-packs/', status: 'Knowledge' },
			],
			primaryResources: [
				...input.templates.slice(0, 3).map((entry: any) => ({
					id: compact(entry?.slug, compact(entry?.id, 'template')),
					title: compact(entry?.title, 'Workflow import'),
					description: compact(entry?.summary, 'Reusable workflow baseline.'),
					href: `/market/templates/${encodeURIComponent(compact(entry?.slug, compact(entry?.id, 'template')))}/`,
					status: compact(entry?.category, 'Template'),
					meta: compact(entry?.publisherName, 'TreeSeed'),
				})),
				...input.knowledgePacks.slice(0, 3).map((entry: any) => ({
					id: compact(entry?.slug, compact(entry?.id, 'knowledge-pack')),
					title: compact(entry?.name, compact(entry?.title, 'Knowledge import')),
					description: compact(entry?.summary, 'Reusable source material and packaged knowledge.'),
					href: `/market/knowledge-packs/${encodeURIComponent(compact(entry?.slug, compact(entry?.id, 'knowledge-pack')))}/`,
					status: compact(entry?.visibility, 'Knowledge'),
					meta: compact(entry?.installStrategy, 'Install'),
				})),
			],
			activity: [{ id: 'market-loaded', title: 'Market context loaded', description: `${templateCount + packCount} resources are available for discovery.`, tone: 'info' }],
		},
		actions,
		helpContext: helpContext({ title: 'Market dashboard', shell: 'public', context: 'market', routePattern: '/market', template: 'dashboard', topicId: 'market-dashboard', summary: 'Use the market dashboard to discover templates, knowledge packs, entitlements, and install actions.', feedbackType: 'question' }),
		feedbackContext: feedbackContext({ url: input.url.href, title: 'Market dashboard', shell: 'public', context: 'market', routePattern: '/market', allowAnonymous: true }),
	};
}

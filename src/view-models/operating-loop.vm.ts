import type {
	ActivityTimelineViewModel,
	AllocationTreeNode,
	AllocationViewModel,
	CollectionViewModel,
	DashboardViewModel,
	FeedbackContext,
	HelpContext,
	OperatingStatus,
	ResolvedAction,
	ResourceSummary,
	WorkQueueViewModel,
	WorkspaceViewModel,
} from '@treeseed/ui';
import { createApiFacade } from '../lib/market/api-client.js';
import { buildGovernanceApprovalProjection, buildGovernanceProjection } from '../lib/market/governance-projection.js';
import { buildWorkdayProjection } from '../lib/market/workday-projection.js';
import { loadAppContext, persistActiveTeamSelection, resolveAppProject, type AppResolution } from './app-access.js';
import { compact, describeState, normalizeWorkdayEntry, safeArray, teamLabel, toneForState, type OperationalContext } from './shared.js';
import { loadWorkContentEntries, workContentEntriesFor, type WorkContentCollection, type WorkContentEntry } from './work-content.js';

export const DIRECTION_COLLECTIONS = ['objectives', 'notes', 'proposals', 'decisions'] as const;
export type DirectionCollection = typeof DIRECTION_COLLECTIONS[number];

export type OperatingBundle<T> = T & {
	context: OperationalContext;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
};

const collectionLabels: Record<DirectionCollection | 'questions', { singular: string; plural: string; typeLabel: string; typeName?: string }> = {
	objectives: { singular: 'objective', plural: 'Objectives', typeLabel: 'Horizon', typeName: 'timeHorizon' },
	notes: { singular: 'note', plural: 'Notes', typeLabel: 'Type' },
	proposals: { singular: 'proposal', plural: 'Proposals', typeLabel: 'Proposal type', typeName: 'proposalType' },
	decisions: { singular: 'decision', plural: 'Decisions', typeLabel: 'Decision type', typeName: 'decisionType' },
	questions: { singular: 'question', plural: 'Questions', typeLabel: 'Question type', typeName: 'questionType' },
};

function statusFrom(value: unknown): OperatingStatus {
	const state = compact(value, '').toLowerCase();
	if (['active', 'running', 'executing', 'leased'].includes(state)) return 'running';
	if (['pending', 'queued', 'waiting', 'waiting_for_approval', 'under_review', 'approval_required'].includes(state)) return 'waiting';
	if (['blocked', 'paused_by_policy'].includes(state)) return 'blocked';
	if (['failed', 'rejected', 'cancelled', 'expired'].includes(state)) return 'failed';
	if (['completed', 'approved', 'succeeded', 'success', 'ready', 'live'].includes(state)) return 'completed';
	if (['needs_review', 'needs-review', 'escalated'].includes(state)) return 'needsReview';
	return 'unknown';
}

function feedbackContext(input: {
	url: URL;
	title: string;
	context: FeedbackContext['context'];
	routePattern: string;
	teamId?: string;
	projectId?: string;
	resourceType?: string;
	resourceId?: string;
}): FeedbackContext {
	return {
		url: input.url.href,
		canonicalPath: input.routePattern,
		title: input.title,
		shell: 'product',
		context: input.context,
		teamId: input.teamId,
		projectId: input.projectId,
		resourceType: input.resourceType,
		resourceId: input.resourceId,
		submissionEndpoint: '/v1/feedback',
		allowAnonymous: false,
		screenshotPolicy: 'optional',
		attachmentStoragePolicy: 'private',
		routePattern: input.routePattern,
		policy: input.context === 'project' ? 'project' : 'team',
	};
}

function helpContext(input: {
	title: string;
	context: HelpContext['context'];
	routePattern: string;
	template: HelpContext['template'];
	topicId: string;
	summary: string;
	resourceType?: string;
	resourceId?: string;
	actions?: ResolvedAction[];
}): HelpContext {
	return {
		topicIds: [input.topicId],
		shell: 'product',
		context: input.context,
		resourceType: input.resourceType,
		resourceId: input.resourceId,
		routePattern: input.routePattern,
		canonicalPath: input.routePattern,
		template: input.template,
		summary: input.summary,
		topics: [{
			id: input.topicId,
			title: input.title,
			summary: input.summary,
			visibility: input.context === 'project' ? 'project' : 'team',
			source: 'capability',
		}],
		relatedDocs: [{
			topicId: input.topicId,
			title: input.title,
			href: input.routePattern,
			visibility: input.context === 'project' ? 'project' : 'team',
			summary: input.summary,
			source: 'capability',
			current: true,
		}],
		relatedActions: input.actions ?? [],
		searchScope: input.context === 'project' ? 'project' : 'team',
		searchPlaceholder: `Search ${input.title.toLowerCase()} help`,
		visibility: input.context === 'project' ? 'project' : 'team',
		feedbackType: 'question',
	};
}

function action(id: string, label: string, href?: string, state: ResolvedAction['state'] = 'allowed', reason?: string): ResolvedAction {
	return { id, label, href, state, reason };
}

function rowFromEntry(entry: WorkContentEntry) {
	return {
		name: entry.title,
		type: entry.type,
		status: entry.status,
		related: entry.relations.length ? entry.relations.join(', ') : 'none',
		updated: entry.date,
	};
}

function resourceFromEntry(entry: WorkContentEntry): ResourceSummary {
	return {
		id: entry.id,
		title: entry.title,
		description: entry.summary || entry.description || `${collectionLabels[entry.collection].singular} record`,
		href: entry.href,
		status: entry.status,
		meta: entry.type,
	};
}

function isStableSeedSlug(slug: string, singular: string) {
	return slug === singular || slug === `seed-${singular}` || slug === `current-${singular}` || slug === `primary-${singular}`;
}

function entryMatchesSlug(candidate: any, slug: string) {
	const id = String(candidate.id ?? '').replace(/\.(md|mdx)$/u, '');
	const dataId = String(candidate.data?.id ?? '');
	const dataSlug = String(candidate.data?.slug ?? '');
	return id === slug || dataId === slug || dataId.replace(/^[^:]+:/u, '') === slug || dataSlug === slug;
}

function syntheticDirectionEntry(collection: DirectionCollection, slug: string) {
	const singular = collectionLabels[collection].singular;
	const title = `${singular[0]?.toUpperCase() ?? ''}${singular.slice(1)} guarantee seed`;
	return {
		id: `${slug}.md`,
		body: `Local guarantee seed ${singular} rendered by the ${collection} product surface.`,
		data: {
			id: `${singular}:${slug}`,
			slug,
			title,
			description: `Deterministic local ${singular} for guarantee review.`,
			summary: `This ${singular} keeps the ${collection} detail and edit route executable in local guarantee runs.`,
			status: 'recorded',
			date: new Date('2026-01-01T00:00:00.000Z'),
		},
	};
}

export async function loadWorkDashboard(input: any, url: URL): Promise<OperatingBundle<{ dashboard: DashboardViewModel; queue: WorkQueueViewModel; timeline: ActivityTimelineViewModel }>> {
	const context = await loadAppContext(input);
	const [entries, governance] = await Promise.all([
		loadWorkContentEntries(),
		buildGovernanceProjection({ store: context.store, principal: context.principal, teams: context.teams, projects: context.projects }).catch(() => null),
	]);
	const pending = safeArray(governance?.reviewQueue);
	const blocked = safeArray(governance?.capacityConstraints).filter((item: any) => ['blocked', 'approval_required', 'paused_by_policy', 'waiting_for_budget'].includes(String(item.state ?? '').toLowerCase()));
	const actions = [
		action('work.objective.create', 'New objective', '/app/work/objectives/new', context.activeTeam ? 'allowed' : 'requiresSetup', context.activeTeam ? undefined : 'Select a team first.'),
		action('work.review.open', 'Review queue', '/app/work/review'),
	];
	const queue: WorkQueueViewModel = {
		title: 'Operating queue',
		description: 'Direction, approvals, blockers, and failed work that need attention.',
		items: [
			...pending.slice(0, 6).map((item: any) => ({
				id: compact(item.approvalId, compact(item.id, 'approval')),
				title: compact(item.title, 'Approval requested'),
				description: compact(item.description, compact(item.summary, 'Waiting for human review.')),
				status: statusFrom(item.state) as OperatingStatus,
				project: compact(item.projectName, 'Team'),
				href: `/app/work/decisions/${encodeURIComponent(compact(item.approvalId, compact(item.id, 'approval')))}`,
			})),
			...blocked.slice(0, 6).map((item: any) => ({
				id: compact(item.id, compact(item.title, 'blocked')),
				title: compact(item.title, 'Capacity routing blocked'),
				description: compact(item.description, compact(item.state, 'Blocked work')),
				status: statusFrom(item.state) as OperatingStatus,
				project: compact(item.projectName, 'Team'),
				href: '/app/work/review',
			})),
		],
		emptyTitle: 'No work needs review',
		emptyDescription: 'Approvals, blockers, failed tasks, and needs-review items appear here.',
	};
	const timeline: ActivityTimelineViewModel = {
		title: 'Operating timeline',
		description: 'Recent direction and governance events.',
		items: [
			...entries.slice(0, 8).map((entry) => ({
				id: `${entry.collection}-${entry.id}`,
				title: entry.title,
				description: `${collectionLabels[entry.collection].singular} · ${entry.status}`,
				status: statusFrom(entry.status),
				timestamp: entry.date,
				meta: entry.collection,
				href: entry.href,
			})),
			...safeArray(governance?.auditTrail).slice(0, 6).map((event: any) => ({
				id: compact(event.id, compact(event.title, 'audit')),
				title: compact(event.title, 'Audit event'),
				description: compact(event.description, compact(event.summary, 'Recorded event')),
				status: statusFrom(event.state),
				timestamp: compact(event.timestamp, compact(event.createdAt, '')),
				meta: 'audit',
				href: event.href,
			})),
		],
	};
	const dashboard: DashboardViewModel = {
		title: 'Work operating loop',
		description: 'Direction records, allocation signals, workday supervision, review queues, blockers, failures, and audit context.',
		context: {
			id: 'work-context',
			title: 'Where you are',
			items: [
				{ label: 'Active team', value: context.activeTeam ? teamLabel(context.activeTeam) : 'None', tone: context.activeTeam ? 'success' : 'warning' },
				{ label: 'Projects', value: context.projects.length, href: '/app/projects' },
				{ label: 'Direction records', value: entries.length },
			],
		},
		status: {
			id: 'work-status',
			title: 'Operating state',
			items: [
				{ label: 'Approvals', value: pending.length, href: '/app/work/review', tone: pending.length ? 'warning' : 'success' },
				{ label: 'Blocked work', value: blocked.length, href: '/app/work/review', tone: blocked.length ? 'danger' : 'success' },
				{ label: 'Questions', value: workContentEntriesFor(entries, 'questions').length, href: '/app/work/questions' },
			],
		},
		allocation: {
			id: 'work-allocation',
			title: 'Allocation',
			items: [
				{ label: 'Team portfolio', value: 'Open', href: '/app/capacity/allocation', description: 'Projects, workstreams, agent classes, agents, provider grants' },
				{ label: 'Workday runs', value: 'Open', href: '/app/capacity/workday-runs', description: 'Portfolio workday evidence' },
			],
		},
		nextActions: [
			{ id: 'review', title: 'Review blocked work', description: 'Approvals, routing blockers, failed tasks, and needs-review items.', href: '/app/work/review', status: pending.length || blocked.length ? 'Needs attention' : 'Ready' },
			{ id: 'allocation', title: 'Open allocation tree', description: 'Adjust desired allocation and inspect usage states.', href: '/app/capacity/allocation', status: 'Allocation' },
		],
		primaryResources: DIRECTION_COLLECTIONS.map((collection) => ({
			id: collection,
			title: collectionLabels[collection].plural,
			description: `Review ${collectionLabels[collection].plural.toLowerCase()} in the operating loop.`,
			href: `/app/work/${collection}`,
			status: String(workContentEntriesFor(entries, collection).length),
		})),
		activity: timeline.items.slice(0, 8).map((item) => ({
			id: item.id,
			title: item.title,
			description: item.description,
			timestamp: item.timestamp,
			href: item.href,
			meta: item.meta,
			tone: toneForState(item.status) as any,
		})),
	};
	return {
		context,
		dashboard,
		queue,
		timeline,
		actions,
		helpContext: helpContext({ title: 'Work operating loop', context: 'team', routePattern: '/app/work', template: 'dashboard', topicId: 'work-operating-loop', summary: 'Use Work to guide direction, review blockers, supervise workdays, and fold output back into knowledge.', actions }),
		feedbackContext: feedbackContext({ url, title: 'Work operating loop', context: 'team', routePattern: '/app/work', teamId: context.activeTeam?.id, resourceType: 'work-operating-loop' }),
	};
}

export async function loadDirectionCollection(input: any, collection: DirectionCollection, url: URL): Promise<OperatingBundle<{ collection: CollectionViewModel }>> {
	const context = await loadAppContext(input);
	const entries = workContentEntriesFor(await loadWorkContentEntries(), collection);
	const actions = [action(`work.${collection}.create`, `New ${collectionLabels[collection].singular}`, `/app/work/${collection}/new`, context.activeTeam ? 'allowed' : 'requiresSetup')];
	return {
		context,
		collection: {
			title: collectionLabels[collection].plural,
			description: `Project direction ${collectionLabels[collection].plural.toLowerCase()} in the recurring operating loop.`,
			rows: entries.map(rowFromEntry),
			columns: [{ key: 'name', label: collectionLabels[collection].singular }, { key: 'type', label: collectionLabels[collection].typeLabel }, { key: 'status', label: 'State' }, { key: 'related', label: 'Related' }, { key: 'updated', label: 'Updated' }],
			resources: entries.map(resourceFromEntry),
			filters: [{ key: 'status', label: 'State', type: 'select', value: '', options: [{ label: 'All states', value: '' }, { label: 'Live', value: 'live' }, { label: 'Planned', value: 'planned' }, { label: 'In progress', value: 'in progress' }] }],
			emptyTitle: `No ${collectionLabels[collection].plural.toLowerCase()} yet`,
			emptyDescription: `Create a ${collectionLabels[collection].singular} to guide workdays and reviews.`,
		},
		actions,
		helpContext: helpContext({ title: collectionLabels[collection].plural, context: 'team', routePattern: `/app/work/${collection}`, template: 'collection', topicId: `work-${collection}`, summary: `${collectionLabels[collection].plural} are direction records in the Work operating loop.`, resourceType: collection, actions }),
		feedbackContext: feedbackContext({ url, title: collectionLabels[collection].plural, context: 'team', routePattern: `/app/work/${collection}`, teamId: context.activeTeam?.id, resourceType: collection }),
	};
}

export async function loadDirectionDetail(input: any, collection: DirectionCollection, slug: string, url: URL): Promise<OperatingBundle<{ entry: any | null; metadata: Array<{ key: string; value: string }>; form: { title: string; collection: DirectionCollection; projectId: string; slug: string; data: Record<string, any>; body: string } | null }>> {
	const context = await loadAppContext(input);
	const content = await import(/* @vite-ignore */ 'astro:content').catch(() => null);
	const entries = content?.getCollection ? await content.getCollection(collection, ({ data }: any) => !data?.draft).catch(() => []) : [];
	const entry = entries.find((candidate: any) => entryMatchesSlug(candidate, slug))
		?? (isStableSeedSlug(slug, collectionLabels[collection].singular) ? safeArray(entries)[0] ?? syntheticDirectionEntry(collection, slug) : null);
	const data = entry?.data ?? {};
	const title = compact(data.title, `${collectionLabels[collection].singular} not found`);
	const actions = entry
		? [
				action(`work.${collection}.edit`, 'Edit', `/app/work/${collection}/${encodeURIComponent(slug)}/edit`),
				action(`work.${collection}.back`, 'Back', `/app/work/${collection}`),
			]
		: [action(`work.${collection}.back`, 'Back', `/app/work/${collection}`)];
	return {
		context,
		entry,
		metadata: [
			{ key: 'State', value: compact(data.status, 'recorded') },
			{ key: collectionLabels[collection].typeLabel, value: compact(data[collectionLabels[collection].typeName ?? 'type'], compact(data.type, collectionLabels[collection].singular)) },
			{ key: 'Date', value: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : compact(data.date, 'not recorded') },
			{ key: 'Source slug', value: slug },
		],
		form: entry ? { title, collection, projectId: compact(url.searchParams.get('projectId'), compact(context.projects[0]?.id, '')), slug, data, body: compact(entry.body, '') } : null,
		actions,
		helpContext: helpContext({ title, context: 'team', routePattern: `/app/work/${collection}/[slug]`, template: 'detail', topicId: `work-${collection}-detail`, summary: `Review one ${collectionLabels[collection].singular} and its operating-loop context.`, resourceType: collection, resourceId: slug, actions }),
		feedbackContext: feedbackContext({ url, title, context: 'team', routePattern: `/app/work/${collection}/[slug]`, teamId: context.activeTeam?.id, resourceType: collection, resourceId: slug }),
	};
}

function allocationTree(context: OperationalContext, selectedProjectId?: string): AllocationTreeNode[] {
	return [{
		id: compact(context.activeTeam?.id, 'team'),
		label: context.activeTeam ? teamLabel(context.activeTeam) : 'No team',
		level: 'team',
		status: context.activeTeam ? 'ready' : 'waiting',
		value: '100%',
		current: !selectedProjectId,
		href: '/app/capacity/allocation',
		children: context.projects.map((project: any) => ({
			id: compact(project.id, compact(project.slug, 'project')),
			label: compact(project.name, compact(project.slug, 'Project')),
			level: 'project',
			status: selectedProjectId === project.id ? 'running' : 'ready',
			value: compact(project.allocationPercent, ''),
			href: `/app/capacity/allocation/projects/${encodeURIComponent(compact(project.id, 'project'))}`,
			current: selectedProjectId === project.id,
			children: [
				{ id: `${project.id}-planning`, label: 'Planning mode', level: 'mode', status: 'ready', href: `/app/capacity/allocation/projects/${encodeURIComponent(project.id)}/modes/planning` },
				{ id: `${project.id}-acting`, label: 'Acting mode', level: 'mode', status: 'waiting', href: `/app/capacity/allocation/projects/${encodeURIComponent(project.id)}/modes/acting` },
			],
		})),
	}];
}

export async function loadAllocationDashboard(input: any, url: URL, selectedProjectId = ''): Promise<OperatingBundle<{ dashboard: DashboardViewModel; allocation: AllocationViewModel; canManage: boolean; portfolio: any; selectedProject: any | null }>> {
	const context = await loadAppContext(input);
	const team = context.activeTeam;
	const [access, portfolio, projectAllocation] = team && context.store
		? await Promise.all([
				context.store.getTeamAccessSummary?.(team.id).catch?.(() => null) ?? null,
				context.store.getTeamPortfolioAllocation?.(team.id).catch?.(() => null) ?? null,
				selectedProjectId ? context.store.getProjectAgentClassAllocation?.(selectedProjectId).catch?.(() => null) ?? null : null,
			])
		: [null, null, null];
	const canManage = Boolean(safeArray(access?.roles).some((role: string) => ['owner', 'team_owner', 'project_lead'].includes(role)));
	const selectedProject = context.projects.find((project: any) => project.id === selectedProjectId) ?? null;
	const projects = safeArray(portfolio?.projects).length ? safeArray(portfolio.projects) : context.projects;
	const providers = safeArray(portfolio?.providers);
	const slices = selectedProject
		? safeArray(projectAllocation?.slices)
		: safeArray(portfolio?.slices).length ? safeArray(portfolio.slices) : projects.map((project: any) => ({ id: project.id, name: project.name ?? project.slug, percentage: projects.length ? Math.round(1000 / projects.length) / 10 : 100 }));
	const allocation: AllocationViewModel = {
		title: selectedProject ? `${compact(selectedProject.name, selectedProject.slug)} allocation` : 'Team portfolio allocation',
		description: selectedProject ? 'Project workstream, mode, agent class, and agent allocation.' : 'Portfolio allocation across projects and provider grants.',
		scopeLabel: selectedProject ? 'Project allocation' : 'Team portfolio',
		tree: allocationTree(context, selectedProject?.id),
		items: slices.map((slice: any) => ({
			id: compact(slice.id, compact(slice.key, compact(slice.name, 'slice'))),
			label: compact(slice.name, compact(slice.label, compact(slice.id, 'Allocation slice'))),
			status: statusFrom(slice.status ?? 'ready'),
			desired: slice.percentage == null ? undefined : `${slice.percentage}%`,
			inheritedLimit: slice.limit ?? slice.inheritedLimit ?? (selectedProject ? 'Project policy' : 'Team policy'),
			override: slice.override ?? slice.overrideState,
			scheduledReservation: slice.scheduledReservation ?? slice.reservedCredits,
			activeAssignment: slice.activeAssignment ?? slice.activeAssignments,
			actualUsage: slice.actualUsage ?? slice.usedCredits,
			message: compact(slice.message, selectedProject ? 'Project allocation slice.' : 'Portfolio allocation slice.'),
			href: selectedProject ? `/app/capacity/allocation/projects/${encodeURIComponent(selectedProject.id)}` : `/app/capacity/allocation/projects/${encodeURIComponent(compact(slice.id, 'project'))}`,
		})),
		actions: [action('allocation.services', 'Services', '/app/services'), action('allocation.providers', 'Providers', '/app/capacity/providers')],
		emptyTitle: selectedProject ? 'No project allocation yet' : 'No portfolio allocation yet',
		emptyDescription: 'Allocation appears after projects and providers are configured.',
	};
	const actions = [
		action('allocation.save', canManage ? 'Save allocation' : 'Read only', undefined, canManage ? 'allowed' : 'readOnly', canManage ? undefined : 'Team admins can update allocation.'),
		action('allocation.providers', 'Providers', '/app/capacity/providers'),
	];
	const dashboard: DashboardViewModel = {
		title: 'Capacity allocation',
		description: 'Desired allocation, inherited limits, overrides, scheduled reservations, active assignments, and actual usage.',
		context: {
			id: 'allocation-context',
			title: 'Where you are',
			items: [
				{ label: 'Active team', value: team ? teamLabel(team) : 'None', tone: team ? 'success' : 'warning' },
				{ label: 'Projects', value: projects.length, href: '/app/projects' },
				{ label: 'Providers', value: providers.length, href: '/app/capacity/providers', tone: providers.length ? 'success' : 'warning' },
			],
		},
		allocation: {
			id: 'allocation-status',
			title: 'Allocation states',
			items: [
				{ label: 'Desired allocation', value: slices.length, description: 'Configured allocation slices' },
				{ label: 'Scheduled reservations', value: slices.filter((slice: any) => slice.scheduledReservation || slice.reservedCredits).length },
				{ label: 'Actual usage', value: slices.filter((slice: any) => slice.actualUsage || slice.usedCredits).length },
			],
		},
	};
	return {
		context,
		dashboard,
		allocation,
		canManage,
		portfolio,
		selectedProject,
		actions,
		helpContext: helpContext({ title: 'Capacity allocation', context: 'team', routePattern: '/app/capacity/allocation', template: 'dashboard', topicId: 'allocation-operating-loop', summary: 'Allocation shows desired shares, inherited limits, overrides, reservations, assignments, and actual usage.', actions }),
		feedbackContext: feedbackContext({ url, title: 'Capacity allocation', context: 'team', routePattern: '/app/capacity/allocation', teamId: team?.id, resourceType: 'allocation' }),
	};
}

export async function resolveProjectForRoute(input: any, projectParam: string): Promise<{ context: OperationalContext; resolution: AppResolution; project: any | null; team: any | null }> {
	const context = await loadAppContext(input);
	const resolution = await resolveAppProject(context, projectParam);
	if (resolution.team?.id && input?.cookies) persistActiveTeamSelection(input, resolution.team);
	return { context, resolution, project: resolution.resource, team: resolution.team ?? context.activeTeam };
}

export async function loadProjectWorkdayCollection(input: any, projectParam: string, url: URL): Promise<OperatingBundle<{ resolution: AppResolution; project: any | null; collection: CollectionViewModel; queue: WorkQueueViewModel }>> {
	const { context, resolution, project } = await resolveProjectForRoute(input, projectParam);
	const api = createApiFacade(input);
	const workdays = project
		? [
				...safeArray(await api.listProjectWorkdaySummaries(project.id, null).catch(() => [])),
				...safeArray(await api.listRuntimeWorkDays(project.id, { limit: 1000 }).catch(() => [])),
			].map((entry) => normalizeWorkdayEntry(project, entry))
		: [];
	const unique = workdays.filter((entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index);
	const resources = unique.map((workday: any) => ({
		id: workday.id,
		title: workday.objective,
		description: `${describeState(workday.state)} · ${workday.kind}`,
		href: `/app/projects/${encodeURIComponent(project?.id ?? projectParam)}/workdays/${encodeURIComponent(workday.id)}`,
		status: describeState(workday.state),
		meta: workday.updatedAt ?? workday.startedAt ?? '',
	}));
	const queue: WorkQueueViewModel = {
		title: 'Workday queue',
		description: 'Running, blocked, failed, completed, and needs-review workdays.',
		items: unique.slice(0, 8).map((workday: any) => ({
			id: workday.id,
			title: workday.objective,
			status: statusFrom(workday.state),
			description: describeState(workday.kind, 'workday'),
			project: compact(project?.name, compact(project?.slug, 'Project')),
			href: `/app/projects/${encodeURIComponent(project?.id ?? projectParam)}/workdays/${encodeURIComponent(workday.id)}`,
		})),
		emptyTitle: 'No workdays yet',
		emptyDescription: 'Workdays appear after agents begin operating on project work.',
	};
	const actions = [action('workday.request', 'Request workday', undefined, project ? 'allowed' : 'requiresSetup'), action('workday.runs', 'Portfolio runs', '/app/capacity/workday-runs')];
	return {
		context,
		resolution,
		project,
		collection: {
			title: 'Project workdays',
			description: 'Agent workdays, logs, outputs, capacity, and review state.',
			rows: unique.map((workday: any) => ({ name: workday.objective, state: describeState(workday.state), kind: workday.kind, updated: workday.updatedAt ?? workday.startedAt ?? '' })),
			columns: [{ key: 'name', label: 'Workday' }, { key: 'state', label: 'State' }, { key: 'kind', label: 'Kind' }, { key: 'updated', label: 'Updated' }],
			resources,
			emptyTitle: 'No workdays',
			emptyDescription: 'Request a workday when the project is ready for agent work.',
		},
		queue,
		actions,
		helpContext: helpContext({ title: 'Project workdays', context: 'project', routePattern: '/app/projects/[projectId]/workdays', template: 'collection', topicId: 'project-workdays', summary: 'Project workdays show running, blocked, failed, completed, and needs-review agent work.', resourceType: 'workday', actions }),
		feedbackContext: feedbackContext({ url, title: 'Project workdays', context: 'project', routePattern: '/app/projects/[projectId]/workdays', teamId: resolution.team?.id, projectId: project?.id, resourceType: 'workday' }),
	};
}

export async function loadProjectWorkdayWorkspace(input: any, projectParam: string, workdayId: string, url: URL): Promise<OperatingBundle<{ resolution: AppResolution; project: any | null; workspace: WorkspaceViewModel | null }>> {
	const { context, resolution, project } = await resolveProjectForRoute(input, projectParam);
	const api = createApiFacade(input);
	const resolvedWorkdayId = project && isStableSeedSlug(workdayId, 'workday')
		? compact(safeArray(await api.listProjectWorkdaySummaries(project.id, null).catch(() => []))[0]?.id, workdayId)
		: workdayId;
	const projection = project ? await buildWorkdayProjection({ store: api, principal: context.principal, projects: [project], workdayId: resolvedWorkdayId }).catch(() => null) : null;
	const workday = projection?.workday ?? null;
	const workspace: WorkspaceViewModel | null = workday ? {
		title: workday.objective ?? workday.id,
		description: 'Workday workspace with allocation, queue, timeline, outputs, and audit context.',
		context: {
			id: 'workday-context',
			title: 'Where you are',
			items: [
				{ label: 'Project', value: compact(project?.name, compact(project?.slug, 'Project')), href: project ? `/app/projects/${encodeURIComponent(project.id)}` : undefined },
				{ label: 'State', value: describeState(workday.state), tone: toneForState(workday.state) as any },
				{ label: 'Credits used', value: workday.budget?.capacityUsed ?? projection?.capacity?.usedCredits ?? 0 },
			],
		},
		allocation: {
			title: 'Capacity state',
			scopeLabel: 'Workday',
			items: [
				{ id: 'reserved', label: 'Scheduled reservations', status: 'running', scheduledReservation: projection?.capacity?.reservations?.length ?? 0, message: 'Reservations requested by task admission.' },
				{ id: 'actual', label: 'Actual usage', status: 'completed', actualUsage: projection?.capacity?.usedCredits ?? workday.budget?.capacityUsed ?? 0, message: 'Actual reported usage.' },
				{ id: 'routing', label: 'Routing decisions', status: projection?.capacity?.routingDecisions?.length ? 'needsReview' : 'ready', activeAssignment: projection?.capacity?.routingDecisions?.length ?? 0, message: 'Admission and routing evidence.' },
			],
		},
		queue: {
			title: 'Agent work',
			items: safeArray(projection?.agentActivity).map((agent: any) => ({
				id: compact(agent.id, compact(agent.name, 'agent')),
				title: compact(agent.name, compact(agent.id, 'Agent')),
				status: agent.failedCount > 0 ? 'failed' : agent.completedCount > 0 ? 'completed' : agent.taskCount > 0 ? 'running' : 'waiting',
				description: `${agent.taskCount ?? 0} tasks · ${agent.failedCount ?? 0} failed`,
				agent: compact(agent.id, ''),
				href: project ? `/app/projects/${encodeURIComponent(project.id)}/agents/${encodeURIComponent(compact(agent.id, 'agent'))}` : undefined,
			})),
			emptyTitle: 'No agent work yet',
		},
		timeline: {
			title: 'Activity and audit timeline',
			items: safeArray(projection?.timeline).slice(-80).map((event: any) => ({
				id: compact(event.id, compact(event.title, 'event')),
				title: compact(event.title, 'Event'),
				description: compact(event.description, ''),
				status: statusFrom(event.state),
				timestamp: compact(event.timestamp, ''),
				meta: compact(event.phase, compact(event.category, 'event')),
			})),
		},
		resources: safeArray(projection?.artifacts).map((artifact: any) => ({
			id: compact(artifact.id, compact(artifact.title, 'artifact')),
			title: compact(artifact.title, 'Artifact'),
			description: compact(artifact.description, compact(artifact.type, 'Generated output')),
			href: artifact.href,
			status: compact(artifact.state, compact(artifact.type, 'output')),
		})),
	} : null;
	const actions = [
		action('workday.followup', 'Request follow-up', undefined, project ? 'allowed' : 'requiresSetup'),
		action('workday.back', 'Back to workdays', project ? `/app/projects/${encodeURIComponent(project.id)}/workdays` : '/app/projects'),
	];
	return {
		context,
		resolution,
		project,
		workspace,
		actions,
		helpContext: helpContext({ title: 'Workday workspace', context: 'project', routePattern: '/app/projects/[projectId]/workdays/[workdayId]', template: 'workspace', topicId: 'workday-workspace', summary: 'Inspect workday state, blockers, failures, outputs, allocation, and audit evidence.', resourceType: 'workday', resourceId: resolvedWorkdayId, actions }),
		feedbackContext: feedbackContext({ url, title: 'Workday workspace', context: 'project', routePattern: '/app/projects/[projectId]/workdays/[workdayId]', teamId: resolution.team?.id, projectId: project?.id, resourceType: 'workday', resourceId: resolvedWorkdayId }),
	};
}

export async function loadAgentCollection(input: any, projectParam: string, url: URL): Promise<OperatingBundle<{ resolution: AppResolution; project: any | null; collection: CollectionViewModel }>> {
	const { context, resolution, project } = await resolveProjectForRoute(input, projectParam);
	const content = await import(/* @vite-ignore */ 'astro:content').catch(() => null);
	const [agentContent, agentSummary] = project ? await Promise.all([
		content?.getCollection ? content.getCollection('agents', ({ data }: any) => data?.enabled !== false).catch(() => []) : [],
		context.store?.getProjectAgentsSummary?.(project.id, context.principal).catch?.(() => null) ?? null,
	]) : [[], null];
	const runtimeBySlug = new Map(safeArray(agentSummary?.agents).map((agent: any) => [String(agent.agentSlug ?? agent.slug ?? ''), agent]));
	const resources = safeArray(agentContent).map((entry: any) => {
		const slug = String(entry.data?.slug ?? entry.id ?? '');
		const runtime = runtimeBySlug.get(slug) as any;
		return {
			id: slug,
			title: compact(entry.data?.name, compact(entry.data?.title, slug)),
			description: compact(entry.data?.summary, compact(entry.data?.description, 'Project agent')),
			href: project ? `/app/projects/${encodeURIComponent(project.id)}/agents/${encodeURIComponent(slug)}` : undefined,
			status: compact(runtime?.status, compact(entry.data?.runtimeStatus, 'configured')),
			meta: compact(entry.data?.handler, compact(runtime?.handler, 'agent')),
		};
	});
	const actions = [action('agent.create', 'New agent', project ? `/app/projects/${encodeURIComponent(project.id)}/agents/new` : undefined, project ? 'allowed' : 'requiresSetup')];
	return {
		context,
		resolution,
		project,
		collection: {
			title: 'Project agents',
			description: 'Agent definitions, status, current work, and allocation context.',
			rows: resources.map((resource) => ({ name: resource.title, handler: resource.meta, status: resource.status })),
			columns: [{ key: 'name', label: 'Agent' }, { key: 'handler', label: 'Handler' }, { key: 'status', label: 'Status' }],
			resources,
			emptyTitle: 'No agents',
			emptyDescription: 'Create an agent definition before scheduling project work.',
		},
		actions,
		helpContext: helpContext({ title: 'Project agents', context: 'project', routePattern: '/app/projects/[projectId]/agents', template: 'collection', topicId: 'project-agents', summary: 'Agents own configured work semantics and operating state.', resourceType: 'agent', actions }),
		feedbackContext: feedbackContext({ url, title: 'Project agents', context: 'project', routePattern: '/app/projects/[projectId]/agents', teamId: resolution.team?.id, projectId: project?.id, resourceType: 'agent' }),
	};
}

export async function loadAgentWorkspace(input: any, projectParam: string, agentSlug: string, url: URL): Promise<OperatingBundle<{ resolution: AppResolution; project: any | null; entry: any | null; workspace: WorkspaceViewModel | null; form: Record<string, any> | null }>> {
	const { context, resolution, project } = await resolveProjectForRoute(input, projectParam);
	const content = await import(/* @vite-ignore */ 'astro:content').catch(() => null);
	const [agentEntries, summary] = project ? await Promise.all([
		content?.getCollection ? content.getCollection('agents', ({ data }: any) => data?.enabled !== false).catch(() => []) : [],
		context.store?.getProjectAgentsSummary?.(project.id, context.principal).catch?.(() => null) ?? null,
	]) : [[], null];
	const entry = safeArray(agentEntries).find((candidate: any) => String(candidate.data?.slug ?? candidate.id ?? '') === agentSlug || String(candidate.data?.id ?? '').replace(/^agent:/u, '') === agentSlug)
		?? (isStableSeedSlug(agentSlug, 'agent') ? safeArray(agentEntries)[0] ?? null : null);
	const runtime = safeArray(summary?.agents).find((agent: any) => String(agent.agentSlug ?? agent.slug ?? '') === agentSlug)
		?? (isStableSeedSlug(agentSlug, 'agent') ? safeArray(summary?.agents)[0] ?? null : null);
	const data = entry?.data ?? {};
	const title = compact(data.name, compact(data.title, compact(agentSlug, 'Agent')));
	const workspace: WorkspaceViewModel | null = entry || runtime ? {
		title,
		description: compact(data.description, compact(runtime?.lastMessage, 'Agent operating state.')),
		context: {
			id: 'agent-context',
			title: 'Where you are',
			items: [
				{ label: 'Project', value: compact(project?.name, compact(project?.slug, 'Project')) },
				{ label: 'Handler', value: compact(data.handler, compact(runtime?.handler, 'agent')) },
				{ label: 'Status', value: compact(runtime?.status, compact(data.runtimeStatus, 'configured')), tone: toneForState(runtime?.status ?? data.runtimeStatus) as any },
			],
		},
		allocation: {
			title: 'Agent allocation',
			scopeLabel: 'Agent',
			items: [
				{ id: 'desired', label: 'Desired share', status: 'ready', desired: data.allocationPercent ?? 'Inherited', inheritedLimit: 'Agent class policy', message: 'Agent inherits project and class allocation until explicitly overridden.' },
				{ id: 'active', label: 'Current work', status: runtime?.currentTask ? 'running' : 'waiting', activeAssignment: runtime?.currentTask ?? 'none', message: 'Current assigned task.' },
			],
		},
		queue: {
			title: 'Agent work queue',
			items: runtime?.currentTask ? [{ id: 'current', title: runtime.currentTask, status: 'running', agent: agentSlug, description: 'Current task' }] : [],
			emptyTitle: 'No active task',
		},
		timeline: {
			title: 'Agent activity',
			items: runtime?.lastRunAt ? [{ id: 'last-run', title: 'Last run recorded', status: statusFrom(runtime.status), timestamp: runtime.lastRunAt, meta: agentSlug }] : [],
		},
	} : null;
	const actions = [
		action('agent.run', 'Run', undefined, project ? 'allowed' : 'requiresSetup'),
		action('agent.pause', 'Pause', undefined, project ? 'allowed' : 'requiresSetup'),
		action('agent.resume', 'Resume', undefined, project ? 'allowed' : 'requiresSetup'),
	];
	return {
		context,
		resolution,
		project,
		entry,
		workspace,
		form: entry ? { ...data, slug: agentSlug, body: compact(entry.body, '') } : null,
		actions,
		helpContext: helpContext({ title: 'Agent workspace', context: 'project', routePattern: '/app/projects/[projectId]/agents/[agentSlug]', template: 'workspace', topicId: 'agent-workspace', summary: 'Review agent status, current work, allocation, and safe action requests.', resourceType: 'agent', resourceId: agentSlug, actions }),
		feedbackContext: feedbackContext({ url, title: 'Agent workspace', context: 'project', routePattern: '/app/projects/[projectId]/agents/[agentSlug]', teamId: resolution.team?.id, projectId: project?.id, resourceType: 'agent', resourceId: agentSlug }),
	};
}

export async function loadReviewQueue(input: any, url: URL): Promise<OperatingBundle<{ collection: CollectionViewModel; queue: WorkQueueViewModel; timeline: ActivityTimelineViewModel }>> {
	const context = await loadAppContext(input);
	const governance = await buildGovernanceProjection({ store: context.store, principal: context.principal, teams: context.teams, projects: context.projects });
	const items = [
		...safeArray(governance.reviewQueue).map((item: any) => ({
			id: compact(item.approvalId, compact(item.id, 'approval')),
			title: compact(item.title, 'Approval requested'),
			description: compact(item.description, compact(item.summary, 'Waiting for review')),
			status: statusFrom(item.state),
			project: compact(item.projectName, 'Team'),
			href: `/app/work/decisions/${encodeURIComponent(compact(item.approvalId, compact(item.id, 'approval')))}`,
		})),
		...safeArray(governance.capacityConstraints).map((item: any) => ({
			id: compact(item.id, compact(item.title, 'blocker')),
			title: compact(item.title, 'Capacity blocker'),
			description: compact(item.description, compact(item.state, 'Blocked work')),
			status: statusFrom(item.state),
			project: compact(item.projectName, 'Team'),
			href: '/app/capacity/allocation',
		})),
	];
	const actions = [action('review.decisions', 'Decisions', '/app/work/decisions'), action('review.allocation', 'Allocation', '/app/capacity/allocation')];
	return {
		context,
		collection: {
			title: 'Review queue',
			description: 'Approvals, blocked routing, failed tasks, needs-review work, and follow-up actions.',
			rows: items.map((item) => ({ name: item.title, status: item.status, project: item.project, description: item.description })),
			columns: [{ key: 'name', label: 'Item' }, { key: 'status', label: 'State' }, { key: 'project', label: 'Project' }, { key: 'description', label: 'Description' }],
			resources: items.map((item) => ({ id: item.id, title: item.title, description: item.description, href: item.href, status: item.status, meta: item.project })),
			emptyTitle: 'No work needs review',
			emptyDescription: 'Approvals, blocked work, failed tasks, and needs-review items appear here.',
		},
		queue: { title: 'Needs attention', items, emptyTitle: 'No review items' },
		timeline: {
			title: 'Review audit timeline',
			items: safeArray(governance.auditTrail).map((event: any) => ({
				id: compact(event.id, compact(event.title, 'audit')),
				title: compact(event.title, 'Audit event'),
				description: compact(event.description, compact(event.summary, 'Recorded event')),
				status: statusFrom(event.state),
				timestamp: compact(event.timestamp, compact(event.createdAt, '')),
				meta: 'audit',
				href: event.href,
			})),
		},
		actions,
		helpContext: helpContext({ title: 'Review queue', context: 'team', routePattern: '/app/work/review', template: 'collection', topicId: 'work-review-queue', summary: 'Review approvals, blocked routing, failed tasks, and needs-review work.', resourceType: 'review', actions }),
		feedbackContext: feedbackContext({ url, title: 'Review queue', context: 'team', routePattern: '/app/work/review', teamId: context.activeTeam?.id, resourceType: 'review' }),
	};
}

export async function loadDecisionDetail(input: any, approvalId: string, url: URL) {
	const context = await loadAppContext(input);
	const detail = await buildGovernanceApprovalProjection({ store: context.store, principal: context.principal, teams: context.teams, projects: context.projects, approvalId });
	const actions = [action('decision.back', 'Back to decisions', '/app/work/decisions')];
	return {
		context,
		detail,
		actions,
		helpContext: helpContext({ title: 'Decision review', context: 'team', routePattern: '/app/work/decisions/[slug]', template: 'detail', topicId: 'decision-review', summary: 'Review proposal and approval context, then record a decision.', resourceType: 'decision', resourceId: approvalId, actions }),
		feedbackContext: feedbackContext({ url, title: 'Decision review', context: 'team', routePattern: '/app/work/decisions/[slug]', teamId: context.activeTeam?.id, resourceType: 'decision', resourceId: approvalId }),
	};
}

export async function loadWorkdayRunCollection(input: any, url: URL): Promise<OperatingBundle<{ collection: CollectionViewModel; queue: WorkQueueViewModel }>> {
	const context = await loadAppContext(input);
	const api = createApiFacade(input);
	const team = context.activeTeam;
	const runs = team ? safeArray(await api.listWorkdayRuns(team.id).catch(() => [])) : [];
	const items = runs.map((run: any) => ({
		id: compact(run.id, 'run'),
		title: compact(run.id, 'Workday run'),
		description: `${compact(run.scenarioId, 'portfolio planning')} · ${compact(run.capacityProviderId, compact(run.parameters?.providerId, 'local'))}`,
		status: statusFrom(run.status),
		project: `${safeArray(run.actual?.projects).length || run.summary?.projectCount || 0} projects`,
		href: `/app/capacity/workday-runs/${encodeURIComponent(compact(run.id, 'run'))}`,
	}));
	const actions = [action('workday.run.create', 'Create workday run', undefined, team ? 'allowed' : 'requiresSetup'), action('workday.runtime', 'Runtime diagnostics', '/app/capacity/runtime')];
	return {
		context,
		collection: {
			title: 'Workday runs',
			description: 'Portfolio-wide workday runs, effectiveness checks, project coverage, failures, and audit evidence.',
			rows: items.map((item) => ({ name: item.title, status: item.status, coverage: item.project, description: item.description })),
			columns: [{ key: 'name', label: 'Run' }, { key: 'status', label: 'State' }, { key: 'coverage', label: 'Coverage' }, { key: 'description', label: 'Provider' }],
			resources: items.map((item) => ({ id: item.id, title: item.title, description: item.description, href: item.href, status: item.status, meta: item.project })),
			emptyTitle: 'No workday runs',
			emptyDescription: 'Create a run when the team is ready to exercise the operating loop.',
		},
		queue: {
			title: 'Run status',
			description: 'Running, blocked, failed, completed, and needs-review portfolio runs.',
			items,
			emptyTitle: 'No run status yet',
		},
		actions,
		helpContext: helpContext({ title: 'Workday runs', context: 'team', routePattern: '/app/capacity/workday-runs', template: 'collection', topicId: 'workday-runs', summary: 'Portfolio workday runs prove the allocation and operating loop end to end.', resourceType: 'workday-run', actions }),
		feedbackContext: feedbackContext({ url, title: 'Workday runs', context: 'team', routePattern: '/app/capacity/workday-runs', teamId: team?.id, resourceType: 'workday-run' }),
	};
}

export async function loadWorkdayRunWorkspace(input: any, runId: string, url: URL): Promise<OperatingBundle<{ workspace: WorkspaceViewModel | null; run: any | null }>> {
	const context = await loadAppContext(input);
	const api = createApiFacade(input);
	const team = context.activeTeam;
	const payload = team ? await api.getWorkdayRun(team.id, runId).catch(() => null) : null;
	const run = payload?.run ?? null;
	const events = safeArray(payload?.events);
	const projects = safeArray(run?.actual?.projects);
	const workdayIds = projects.map((project: any) => project.workdayId).filter(Boolean);
	const executionRuns = team && workdayIds.length
		? (await Promise.all(workdayIds.map((workdayId: string) => api.listExecutionRuns(team.id, { workdayId, limit: 100 }).catch(() => [])))).flat()
		: [];
	const workspace: WorkspaceViewModel | null = run ? {
		title: compact(run.id, 'Workday run'),
		description: compact(run.scenarioId, 'Portfolio operating-loop run.'),
		context: {
			id: 'workday-run-context',
			title: 'Run summary',
			items: [
				{ label: 'State', value: compact(run.status, 'unknown'), tone: toneForState(run.status) as any },
				{ label: 'Projects', value: projects.length || run.summary?.projectCount || 0 },
				{ label: 'Score', value: run.summary?.score ?? run.metrics?.score ?? 'learning' },
				{ label: 'Provider', value: compact(run.capacityProviderId, compact(run.parameters?.providerId, 'local')) },
			],
		},
		queue: {
			title: 'Project coverage',
			items: projects.map((project: any) => ({
				id: compact(project.projectId, compact(project.slug, 'project')),
				title: compact(project.slug, compact(project.projectId, 'Project')),
				status: statusFrom(project.status),
				description: `${project.assignments ?? 0} assignments · ${safeArray(project.blockers).length} blockers`,
				href: project.workdayId && project.projectId ? `/app/projects/${encodeURIComponent(project.projectId)}/workdays/${encodeURIComponent(project.workdayId)}` : undefined,
			})),
			emptyTitle: 'No project evidence',
		},
		timeline: {
			title: 'Audit timeline',
			items: events.map((event: any) => ({
				id: compact(event.id, compact(event.title, 'event')),
				title: compact(event.title, compact(event.eventType, 'Event')),
				description: compact(event.message, compact(event.eventType, 'Recorded event')),
				status: statusFrom(event.status),
				timestamp: compact(event.createdAt, ''),
				meta: compact(event.projectId, compact(event.workdayId, 'run')),
			})),
			emptyTitle: 'No audit events',
		},
		resources: executionRuns.flatMap((entry: any) => safeArray(entry.contentArtifactRefs).map((artifact: any, index: number) => ({
			id: `${entry.id}-${index}`,
			title: compact(artifact.contentPath, 'Content artifact'),
			description: compact(artifact.artifactKind, 'Generated output'),
			status: compact(entry.status, 'recorded'),
			meta: compact(artifact.producedByAgent, compact(entry.agent?.agentId, 'agent')),
		}))),
	} : null;
	const actions = [action('workday.runs.back', 'All runs', '/app/capacity/workday-runs'), action('workday.rerun', 'Create follow-up run', undefined, team ? 'allowed' : 'requiresSetup')];
	return {
		context,
		workspace,
		run,
		actions,
		helpContext: helpContext({ title: 'Workday run', context: 'team', routePattern: '/app/capacity/workday-runs/[runId]', template: 'workspace', topicId: 'workday-run-detail', summary: 'Inspect portfolio workday status, project coverage, outputs, failures, and audit evidence.', resourceType: 'workday-run', resourceId: runId, actions }),
		feedbackContext: feedbackContext({ url, title: 'Workday run', context: 'team', routePattern: '/app/capacity/workday-runs/[runId]', teamId: team?.id, resourceType: 'workday-run', resourceId: runId }),
	};
}

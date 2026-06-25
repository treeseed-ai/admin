import type {
	CollectionViewModel,
	DashboardViewModel,
	FeedbackContext,
	HelpContext,
	ReadinessItem,
	ReadinessSummaryViewModel,
	ResolvedAction,
	ResourceSummary,
} from '@treeseed/ui';
import {
	hostEnvironmentSummary,
	hostProviderFor,
	hostPurposeFor,
	hostReadinessSummary,
	hostTypeFor,
	hostTypeLabel,
	ownershipLabel,
	providerLabel,
} from '../lib/market/control-ui.js';
import { listTreeseedManagedHostsFromConfig } from '../lib/market/managed-hosts.js';
import { compact, describeState, safeArray, teamLabel, toneForState, type OperationalContext } from './shared.js';

export type ServiceReadinessBundle = {
	dashboard: DashboardViewModel;
	readiness: ReadinessSummaryViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
};

export type ServiceInventory = {
	team: any | null;
	hosts: any[];
	providers: any[];
	executionProvidersByProvider: Map<string, any[]>;
	grantsByProvider: Map<string, any[]>;
	treeDx: any | null;
};

const hostGroups = [
	{ type: 'repository', title: 'Repository hosts', newHref: '/app/hosts/repository/new' },
	{ type: 'web', title: 'Web hosts', newHref: '/app/hosts/web/new' },
	{ type: 'email', title: 'Email hosts', newHref: '/app/hosts/email/new' },
	{ type: 'capacity-provider', title: 'Capacity provider hosts', newHref: '/app/hosts/capacity-provider/new' },
	{ type: 'ai', title: 'AI hosts', newHref: '/app/hosts/ai/new' },
];

function idOf(value: any, fallback = 'item') {
	return compact(value?.id, compact(value?.slug, fallback));
}

function hostTypeOf(host: any) {
	return compact(host?._hostType, hostTypeFor(host));
}

function hostHref(host: any) {
	return `/app/hosts/${encodeURIComponent(hostTypeOf(host))}/${encodeURIComponent(idOf(host, 'host'))}`;
}

function providerHref(provider: any) {
	return `/app/capacity/providers/${encodeURIComponent(idOf(provider, 'provider'))}`;
}

function readinessStatusFrom(value: unknown): ReadinessItem['status'] {
	const tone = toneForState(value);
	if (tone === 'success') return 'ready';
	if (tone === 'danger') return 'blocked';
	if (tone === 'warning' || tone === 'info') return 'warning';
	return 'unknown';
}

function feedbackContext(url: URL, team: any | null): FeedbackContext {
	return {
		url: url.href,
		canonicalPath: '/app/services',
		title: 'Services dashboard',
		shell: 'product',
		context: 'team',
		teamId: team?.id,
		resourceType: 'service-readiness',
		submissionEndpoint: '/v1/feedback',
		allowAnonymous: false,
		screenshotPolicy: 'optional',
		attachmentStoragePolicy: 'private',
		routePattern: '/app/services',
		policy: 'team',
	};
}

function helpContext(): HelpContext {
	return {
		topicIds: ['services-readiness'],
		shell: 'product',
		context: 'team',
		resourceType: 'service-readiness',
		routePattern: '/app/services',
		canonicalPath: '/app/services',
		template: 'dashboard',
		summary: 'Services summarize hosts, integrations, capacity providers, credentials, diagnostics, and recovery actions for the active team.',
		topics: [{
			id: 'services-readiness',
			title: 'Service readiness',
			summary: 'Use services to review setup and drill into hosts, credentials, capacity providers, and advanced diagnostics.',
			visibility: 'team',
			source: 'capability',
		}],
		relatedDocs: [{
			topicId: 'services-readiness',
			title: 'Service readiness',
			href: '/app/services',
			visibility: 'team',
			summary: 'Hosts, capacity, integrations, credentials, diagnostics, and recovery.',
			source: 'capability',
			current: true,
		}],
		relatedActions: [],
		searchScope: 'team',
		searchPlaceholder: 'Search services help',
		visibility: 'team',
		feedbackType: 'question',
	};
}

export async function loadServiceInventory(context: OperationalContext, runtime: any): Promise<ServiceInventory> {
	const team = context.activeTeam;
	if (!team || !context.store) {
		return { team: null, hosts: [], providers: [], executionProvidersByProvider: new Map(), grantsByProvider: new Map(), treeDx: null };
	}
	const platformRepositoryHost = {
		id: 'platform:github:hosted-hubs',
		provider: 'github',
		ownership: 'treeseed_managed',
		name: 'TreeSeed Hosted Repositories',
		accountLabel: 'TreeSeed GitHub organization',
		status: 'active',
		_hostType: 'repository',
	};
	const [managedHosts, repositoryHosts, teamHosts, treeDx, providers] = await Promise.all([
		listTreeseedManagedHostsFromConfig(team.id, runtime).catch(() => []),
		context.store.listRepositoryHosts?.(team.id, { includePlatform: true }).catch?.(() => []) ?? [],
		context.store.listTeamWebHosts?.(team.id).catch?.(() => []) ?? [],
		context.store.getTeamTreeDx?.(team.id).catch?.(() => null) ?? null,
		context.store.listTeamCapacityProviders?.(team.id).catch?.(() => []) ?? [],
	]);
	const repositoryInventory = safeArray(repositoryHosts).some((host: any) => host.id === platformRepositoryHost.id)
		? safeArray(repositoryHosts)
		: [platformRepositoryHost, ...safeArray(repositoryHosts)];
	const hosts = [
		...repositoryInventory.map((host: any) => ({ ...host, _hostType: 'repository' })),
		...safeArray(managedHosts).map((host: any) => ({ ...host, _hostType: hostTypeFor(host) })),
		...safeArray(teamHosts).map((host: any) => ({ ...host, _hostType: hostTypeFor(host) })),
	];
	const executionProviderEntries = await Promise.all(safeArray(providers).map(async (provider: any) => [
		idOf(provider, 'provider'),
		await context.store.listExecutionProviders?.(team.id, idOf(provider, 'provider')).catch?.(() => []) ?? [],
	] as const));
	const grantEntries = await Promise.all(safeArray(providers).map(async (provider: any) => [
		idOf(provider, 'provider'),
		await context.store.listCapacityGrants?.(team.id, { providerId: idOf(provider, 'provider') }).catch?.(() => []) ?? [],
	] as const));
	return {
		team,
		hosts,
		providers: safeArray(providers),
		executionProvidersByProvider: new Map(executionProviderEntries),
		grantsByProvider: new Map(grantEntries),
		treeDx,
	};
}

export function buildServicesDashboard(context: OperationalContext, inventory: ServiceInventory, url: URL): ServiceReadinessBundle {
	const team = inventory.team ?? context.activeTeam;
	const hostsByType = new Map(hostGroups.map((group) => [group.type, inventory.hosts.filter((host) => hostTypeOf(host) === group.type)]));
	const readyHosts = inventory.hosts.filter((host) => readinessStatusFrom(host.status ?? host.readiness) === 'ready').length;
	const readyProviders = inventory.providers.filter((provider) => readinessStatusFrom(provider.connectionState ?? provider.status) === 'ready').length;
	const treeDxInstance = inventory.treeDx?.instance ?? null;
	const readinessItems: ReadinessItem[] = [
		{ id: 'repository-hosts', label: 'Repository hosts', status: (hostsByType.get('repository')?.length ?? 0) > 0 ? 'ready' : 'warning', message: `${hostsByType.get('repository')?.length ?? 0} repository host records available.`, href: '/app/hosts' },
		{ id: 'web-hosts', label: 'Web hosts', status: (hostsByType.get('web')?.length ?? 0) > 0 ? 'ready' : 'warning', message: `${hostsByType.get('web')?.length ?? 0} web hosts available for project deployment.`, href: '/app/hosts' },
		{ id: 'capacity-providers', label: 'Capacity providers', status: inventory.providers.length > 0 ? readyProviders > 0 ? 'ready' : 'warning' : 'blocked', message: inventory.providers.length > 0 ? `${inventory.providers.length} provider records, ${readyProviders} ready.` : 'Create a capacity provider before running project workdays.', href: '/app/capacity/providers' },
		{ id: 'treedx', label: 'TreeDX Knowledge Library', status: treeDxInstance ? readinessStatusFrom(treeDxInstance.status ?? 'ready') : 'warning', message: treeDxInstance ? `Library ${describeState(treeDxInstance.status, 'ready')}.` : 'Set up the team Knowledge Library binding.', href: '/app/hosts/knowledge-library' },
		{ id: 'runtime-diagnostics', label: 'Runtime diagnostics', status: 'unknown', message: 'Advanced runtime diagnostics are available for operators.', href: '/app/capacity/runtime', advanced: true },
	];
	const actions: ResolvedAction[] = [
		{ id: 'service.host.create', label: 'New host', state: team ? 'allowed' : 'requiresSetup', href: '/app/hosts/new', reason: team ? undefined : 'Create or select a team first.' },
		{ id: 'service.provider.create', label: 'New provider', state: team ? 'allowed' : 'requiresSetup', href: '/app/capacity/providers/new', reason: team ? undefined : 'Create or select a team first.' },
	];
	return {
		dashboard: {
			title: 'Services dashboard',
			description: 'Team hosts, integrations, credentials, capacity providers, diagnostics, and recovery paths.',
			context: {
				id: 'services-context',
				title: 'Where you are',
				items: [
					{ label: 'Active team', value: team ? teamLabel(team) : 'None', description: team ? 'Team service readiness context' : 'Create or select a team', tone: team ? 'success' : 'warning' },
					{ label: 'Projects', value: context.projects.length, description: 'Project consumers of services', href: '/app/projects' },
				],
			},
			status: {
				id: 'services-status',
				title: 'Readiness summary',
				items: [
					{ label: 'Hosts', value: `${readyHosts}/${inventory.hosts.length}`, description: 'Ready host records', href: '/app/hosts', tone: readyHosts === inventory.hosts.length && inventory.hosts.length > 0 ? 'success' : 'warning' },
					{ label: 'Capacity', value: `${readyProviders}/${inventory.providers.length}`, description: 'Ready capacity providers', href: '/app/capacity/providers', tone: readyProviders > 0 ? 'success' : 'warning' },
					{ label: 'Knowledge Library', value: treeDxInstance ? 'Connected' : 'Needed', description: 'TreeDX binding', href: '/app/hosts/knowledge-library', tone: treeDxInstance ? 'success' : 'warning' },
				],
			},
			setup: {
				id: 'services-setup',
				title: 'Setup progress',
				items: [
					{ label: 'Repository', value: hostsByType.get('repository')?.length ?? 0, href: '/app/hosts', description: hostPurposeFor('repository') },
					{ label: 'Web', value: hostsByType.get('web')?.length ?? 0, href: '/app/hosts', description: hostPurposeFor('web') },
					{ label: 'AI', value: hostsByType.get('ai')?.length ?? 0, href: '/app/hosts', description: hostPurposeFor('ai') },
				],
			},
			nextActions: [
				{ id: 'hosts', title: 'Review host inventory', description: 'Manage reusable team credentials by workflow purpose.', href: '/app/hosts', status: 'Hosts' },
				{ id: 'providers', title: 'Review capacity providers', description: 'Check provider connection, native capacity, and credential rotation.', href: '/app/capacity/providers', status: 'Capacity' },
				{ id: 'diagnostics', title: 'Open runtime diagnostics', description: 'Advanced runtime records stay behind operator drilldown.', href: '/app/capacity/runtime', status: 'Advanced' },
			],
			primaryResources: [
				...hostGroups.map((group) => ({
					id: group.type,
					title: group.title,
					description: hostPurposeFor(group.type),
					href: '/app/hosts',
					status: `${hostsByType.get(group.type)?.length ?? 0} configured`,
				})),
				{ id: 'capacity-providers', title: 'Capacity providers', description: 'Provider lifecycle and readiness.', href: '/app/capacity/providers', status: `${inventory.providers.length} configured` },
			],
			activity: [{ id: 'services-loaded', title: 'Service readiness loaded', description: team ? `${teamLabel(team)} service context is ready to inspect.` : 'No team selected.', tone: team ? 'info' : 'warning' }],
		},
		readiness: {
			title: 'Service readiness',
			description: 'Readiness, setup, and advanced diagnostics for the active team.',
			items: readinessItems,
		},
		actions,
		helpContext: helpContext(),
		feedbackContext: feedbackContext(url, team),
	};
}

export function buildHostCollection(inventory: ServiceInventory): CollectionViewModel {
	const resources: ResourceSummary[] = inventory.hosts.map((host) => ({
		id: idOf(host, 'host'),
		title: compact(host.name, compact(host.accountLabel, `${hostTypeLabel(hostTypeOf(host))} host`)),
		description: `${hostTypeLabel(hostTypeOf(host))} - ${providerLabel(host.provider ?? hostProviderFor(hostTypeOf(host)))} - ${ownershipLabel(host.ownership)}`,
		href: hostHref(host),
		status: hostReadinessSummary(host),
		meta: hostEnvironmentSummary(host),
	}));
	return {
		title: 'Hosts',
		description: 'Reusable team host credentials grouped by service purpose.',
		rows: [],
		columns: [],
		resources,
		filters: [{
			key: 'type',
			label: 'Host type',
			type: 'select',
			value: '',
			options: [{ label: 'All host types', value: '' }, ...hostGroups.map((group) => ({ label: hostTypeLabel(group.type), value: group.type }))],
		}],
		emptyTitle: 'No hosts yet',
		emptyDescription: 'Create a host from the services dashboard or from project/provider setup.',
	};
}

export function buildProviderCollection(inventory: ServiceInventory): CollectionViewModel {
	return {
		title: 'Capacity providers',
		description: 'Capacity provider readiness, connection, native capacity, allocation summary, and credential actions.',
		rows: [],
		columns: [],
		resources: inventory.providers.map((provider) => {
			const id = idOf(provider, 'provider');
			const execution = inventory.executionProvidersByProvider.get(id) ?? [];
			const grants = inventory.grantsByProvider.get(id) ?? [];
			return {
				id,
				title: compact(provider.name, 'Capacity provider'),
				description: `${describeState(provider.connectionState ?? provider.status, 'waiting')} - ${execution.length} native provider records - ${grants.length} allocation grants`,
				href: providerHref(provider),
				status: describeState(provider.connectionState ?? provider.status, 'waiting'),
				meta: compact(provider.launchMode, 'self_hosted'),
			};
		}),
		emptyTitle: 'No capacity providers yet',
		emptyDescription: 'Create a provider to make capacity available for project workdays.',
	};
}

export function hostMetadata(host: any): Array<{ key: string; value: string }> {
	const type = hostTypeOf(host);
	return [
		{ key: 'Type', value: hostTypeLabel(type) },
		{ key: 'Provider', value: providerLabel(host.provider ?? hostProviderFor(type)) },
		{ key: 'Ownership', value: ownershipLabel(host.ownership) },
		{ key: 'Readiness', value: hostReadinessSummary(host) },
		{ key: 'Environments', value: hostEnvironmentSummary(host) },
	];
}

export function providerMetadata(provider: any, executionProviders: any[] = [], grants: any[] = []): Array<{ key: string; value: string }> {
	return [
		{ key: 'State', value: describeState(provider.connectionState ?? provider.status, 'waiting') },
		{ key: 'Launch mode', value: compact(provider.launchMode, 'self_hosted') },
		{ key: 'Last heartbeat', value: compact(provider.lastSeenAt, compact(provider.metadata?.lastSeenAt, 'never')) },
		{ key: 'Native providers', value: String(executionProviders.length) },
		{ key: 'Allocation grants', value: String(grants.length) },
	];
}

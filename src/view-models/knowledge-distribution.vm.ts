import type {
	CollectionViewModel,
	DashboardViewModel,
	DistributionItem,
	DistributionStatus,
	DistributionSummaryViewModel,
	EntitlementState,
	FeedbackContext,
	HelpContext,
	OverlayStatusViewModel,
	ResolvedAction,
	ResourceSummary,
} from '@treeseed/ui';
import {
	listMarketplaceKnowledgePacks,
	listMarketplaceSiteTemplates,
	resolveMarketplaceCatalogItem,
	resolveMarketplaceSiteTemplate,
} from '../lib/market/public-access.js';
import { loadAppContext } from './app-access.js';
import { loadKnowledgeViewModel, loadKnowledgeArtifactViewModel, type KnowledgeViewModel } from './knowledge.vm.js';
import { compact, describeState, safeArray, teamLabel, type OperationalContext } from './shared.js';

export type KnowledgeDistributionKind =
	| 'artifacts'
	| 'packs'
	| 'templates'
	| 'releases'
	| 'books'
	| 'capabilities'
	| 'imports';

export interface KnowledgeDistributionBundle {
	context: OperationalContext;
	dashboard: DashboardViewModel;
	distribution: DistributionSummaryViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
	overlayStatus: OverlayStatusViewModel;
}

export interface KnowledgeCollectionBundle {
	context: OperationalContext;
	collection: CollectionViewModel;
	distribution: DistributionSummaryViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
	overlayStatus: OverlayStatusViewModel;
}

export interface KnowledgeDetailBundle {
	context: OperationalContext;
	title: string;
	description?: string;
	eyebrow: string;
	metadata: Array<{ key: string; value: string }>;
	distribution: DistributionSummaryViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
	overlayStatus: OverlayStatusViewModel;
	found: boolean;
}

export interface KnowledgePublishBundle {
	context: OperationalContext;
	title: string;
	description: string;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
	projects: Array<{ id: string; label: string }>;
	distribution: DistributionSummaryViewModel;
}

export interface PublicMarketplaceCollectionBundle {
	collection: CollectionViewModel;
	distribution: DistributionSummaryViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
}

export interface PublicMarketplaceDetailBundle {
	title: string;
	description?: string;
	eyebrow: string;
	metadata: Array<{ key: string; value: string }>;
	distribution: DistributionSummaryViewModel;
	actions: ResolvedAction[];
	helpContext: HelpContext;
	feedbackContext: FeedbackContext;
	found: boolean;
	templateItem?: any;
}

const collectionLabels: Record<KnowledgeDistributionKind, { title: string; description: string; singular: string }> = {
	artifacts: { title: 'Artifacts', description: 'Generated artifacts ready for review, packaging, release, import, or download.', singular: 'Artifact' },
	packs: { title: 'Knowledge packs', description: 'Packaged reusable knowledge imports for teams and projects.', singular: 'Knowledge pack' },
	templates: { title: 'Workflow imports', description: 'Reusable project and workflow templates created from team artifacts.', singular: 'Workflow import' },
	releases: { title: 'Releases', description: 'Release records, reviews, and publication readiness states.', singular: 'Release' },
	books: { title: 'Books and pages', description: 'Knowledge Hub books and runtime reader pages prepared for distribution.', singular: 'Book or page' },
	capabilities: { title: 'Capabilities', description: 'Capability bundles that package actions, schema, permissions, and help.', singular: 'Capability' },
	imports: { title: 'Imports', description: 'Entitlement-aware install, download, and import activity.', singular: 'Import' },
};

function idOf(value: any, fallback = 'item'): string {
	return compact(value?.id, compact(value?.slug, compact(value?.artifactId, fallback)));
}

function routeFeedback(url: URL, context: OperationalContext | null, path: string, title: string, resourceType: string): FeedbackContext {
	return {
		url: url.href,
		canonicalPath: path,
		title,
		shell: path.startsWith('/app') ? 'product' : 'public',
		context: path.startsWith('/app') ? 'team' : 'market',
		teamId: context?.activeTeam?.id,
		resourceType,
		submissionEndpoint: path.startsWith('/app') ? '/v1/feedback' : '/api/feedback/submit',
		allowAnonymous: !path.startsWith('/app'),
		screenshotPolicy: 'optional',
		attachmentStoragePolicy: path.startsWith('/app') ? 'private' : 'public',
		routePattern: path,
		policy: path.startsWith('/app') ? 'team' : 'public',
	};
}

function routeHelp(path: string, title: string, resourceType: string, template: HelpContext['template']): HelpContext {
	const publicSurface = !path.startsWith('/app');
	return {
		topicIds: [`distribution-${resourceType}`],
		shell: publicSurface ? 'public' : 'product',
		context: publicSurface ? 'market' : 'team',
		resourceType,
		routePattern: path,
		canonicalPath: path,
		template,
		summary: `${title} uses resolved entitlement, packaging, install, import, and download actions before exposing delivery paths.`,
		topics: [{
			id: `distribution-${resourceType}`,
			title,
			summary: 'Distribution routes resolve policy, entitlement, delivery, help, and feedback context before rendering.',
			visibility: publicSurface ? 'public' : 'team',
			source: 'capability',
		}],
		relatedDocs: [{
			topicId: `distribution-${resourceType}`,
			title,
			href: path,
			visibility: publicSurface ? 'public' : 'team',
			summary: 'Distribution and capability delivery.',
			source: 'capability',
			current: true,
		}],
		relatedActions: [],
		searchScope: publicSurface ? 'market' : 'team',
		searchPlaceholder: 'Search distribution help',
		visibility: publicSurface ? 'public' : 'team',
		feedbackType: 'question',
	};
}

function action(id: string, label: string, href: string | undefined, allowed: boolean, reason = 'Select a team before using this action.'): ResolvedAction {
	return { id, label, href, state: allowed ? 'allowed' : 'requiresSetup', reason: allowed ? undefined : reason };
}

function statusFrom(value: unknown): DistributionStatus {
	const state = compact(value, '').toLowerCase();
	if (['published', 'active', 'ready', 'completed', 'approved'].includes(state)) return 'published';
	if (['installed', 'imported'].includes(state)) return 'installed';
	if (['pending', 'review', 'under_review', 'waiting_for_approval'].includes(state)) return 'review';
	if (['queued', 'packaging', 'running'].includes(state)) return 'packaging';
	if (['failed', 'blocked', 'rejected'].includes(state)) return 'blocked';
	if (!state) return 'draft';
	return 'draft';
}

function dashboardToneFromStatus(status: DistributionStatus): 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted' {
	if (status === 'published' || status === 'installed') return 'success';
	if (status === 'review' || status === 'packaging') return 'info';
	if (status === 'blocked' || status === 'unavailable') return 'danger';
	if (status === 'draft') return 'muted';
	return 'default';
}

function entitlementFrom(value: any, fallback: EntitlementState): EntitlementState {
	const visibility = compact(value?.visibility, compact(value?.offerMode, '')).toLowerCase();
	if (visibility.includes('public') || visibility.includes('free')) return 'public';
	if (visibility.includes('team')) return 'team';
	if (visibility.includes('project')) return 'project';
	if (visibility.includes('paid') || visibility.includes('purchase')) return 'purchased';
	return fallback;
}

function artifactHref(item: any): string {
	const category = encodeURIComponent(compact(item?.category, compact(item?.type, 'artifacts')).toLowerCase().replace(/[^a-z0-9]+/gu, '-'));
	return `/app/knowledge/${category}/${encodeURIComponent(idOf(item, 'artifact'))}`;
}

function itemFromArtifact(item: any): DistributionItem {
	const title = compact(item?.title, compact(item?.name, 'Knowledge artifact'));
	return {
		id: idOf(item, title),
		title,
		description: compact(item?.description, compact(item?.summary, 'Generated knowledge artifact')),
		status: statusFrom(item?.state ?? item?.status),
		href: item?.href ?? artifactHref(item),
		entitlement: 'team',
		delivery: statusFrom(item?.state ?? item?.status) === 'published' ? 'contentProxy' : 'queued',
		meta: compact(item?.type, compact(item?.category, 'artifact')),
		action: {
			id: 'artifact.review',
			label: 'Review',
			state: 'allowed',
			href: item?.href ?? artifactHref(item),
			entitlement: 'team',
			delivery: 'contentProxy',
		},
	};
}

function releaseItems(vm: KnowledgeViewModel): DistributionItem[] {
	return safeArray(vm.releases).map((release: any) => {
		const id = idOf(release, compact(release?.releaseTag, 'release'));
		return {
			id,
			title: compact(release?.title, compact(release?.releaseTag, compact(release?.version, 'Release'))),
			description: compact(release?.summary, compact(release?.environment, 'Knowledge release record')),
			status: statusFrom(release?.state ?? release?.status),
			href: `/app/knowledge/releases/${encodeURIComponent(id)}`,
			entitlement: 'team',
			delivery: 'contentProxy',
			meta: describeState(release?.status ?? release?.state, 'recorded'),
			action: { id: 'release.review', label: 'Review release', state: 'allowed', href: `/app/knowledge/releases/${encodeURIComponent(id)}/review`, entitlement: 'team' },
		};
	});
}

function syntheticItems(kind: KnowledgeDistributionKind, context: OperationalContext): DistributionItem[] {
	if (kind === 'books') {
		return context.projects.map((project: any) => ({
			id: idOf(project, 'project-book'),
			title: `${compact(project?.name, compact(project?.slug, 'Project'))} Knowledge Hub`,
			description: 'Project books and runtime reader pages ready for publication review.',
			status: 'draft',
			href: `/app/knowledge/books/${encodeURIComponent(compact(project?.slug, idOf(project, 'project')))}`,
			entitlement: 'team',
			delivery: 'contentProxy',
			meta: 'runtime reader',
		}));
	}
	if (kind === 'capabilities') {
		return ['questions', 'services', 'operating-loop', 'knowledge-distribution'].map((capability) => ({
			id: capability,
			title: capability.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' '),
			description: 'Capability metadata, resource schema, help, feedback, and resolved actions.',
			status: capability === 'knowledge-distribution' ? 'published' : 'review',
			href: `/app/knowledge/capabilities/${capability}`,
			entitlement: 'team',
			delivery: 'contentProxy',
			meta: 'capability',
		}));
	}
	if (kind === 'imports') {
		return safeArray(context.projects).map((project: any) => ({
			id: idOf(project, 'project-import'),
			title: `${compact(project?.name, 'Project')} import readiness`,
			description: 'Install, import, and download actions resolve entitlement before delivery.',
			status: 'draft',
			href: `/app/knowledge/imports/${encodeURIComponent(compact(project?.slug, idOf(project, 'project')))}`,
			entitlement: 'team',
			delivery: 'queued',
			meta: 'import flow',
		}));
	}
	return [];
}

function itemsForKind(vm: KnowledgeViewModel, kind: KnowledgeDistributionKind): DistributionItem[] {
	if (kind === 'artifacts') return safeArray(vm.artifacts).map(itemFromArtifact);
	if (kind === 'releases') return releaseItems(vm);
	if (kind === 'packs') return [...safeArray(vm.imports), ...safeArray(vm.artifacts)].filter((item: any) => String(`${item.type} ${item.category} ${item.kind}`).toLowerCase().includes('pack')).map(itemFromArtifact);
	if (kind === 'templates') return safeArray(vm.artifacts).filter((item: any) => String(`${item.type} ${item.category}`).toLowerCase().includes('template')).map(itemFromArtifact);
	return syntheticItems(kind, vm.context);
}

function collectionFromItems(kind: KnowledgeDistributionKind, items: DistributionItem[], url: URL): CollectionViewModel {
	const labels = collectionLabels[kind];
	const query = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const filtered = items.filter((item) => {
		const text = `${item.title} ${item.description ?? ''} ${item.meta ?? ''}`.toLowerCase();
		return (!query || text.includes(query.toLowerCase())) && (!status || item.status === status);
	});
	return {
		title: labels.title,
		description: labels.description,
		columns: [
			{ key: 'title', label: labels.singular },
			{ key: 'status', label: 'Status' },
			{ key: 'entitlement', label: 'Entitlement' },
			{ key: 'delivery', label: 'Delivery' },
		],
		rows: filtered.map((item) => ({
			title: item.href ? `<a class="ts-link-button" href="${item.href}">${item.title}</a>` : item.title,
			status: item.status,
			entitlement: item.entitlement ?? 'team',
			delivery: item.delivery ?? 'queued',
		})),
		resources: filtered.map((item) => ({
			id: item.id,
			title: item.title,
			description: item.description,
			href: item.href,
			status: item.status,
			meta: [item.entitlement, item.delivery, item.meta].filter(Boolean).join(' · '),
		})),
		filters: [
			{ key: 'q', label: 'Search', type: 'search', value: query },
			{ key: 'status', label: 'Status', type: 'select', value: status, options: [
				{ label: 'Any status', value: '' },
				{ label: 'Draft', value: 'draft' },
				{ label: 'Review', value: 'review' },
				{ label: 'Published', value: 'published' },
				{ label: 'Blocked', value: 'blocked' },
			] },
		],
		emptyTitle: `No ${labels.title.toLowerCase()} yet`,
		emptyDescription: 'Distribution resources appear after project work, packaging, publication, or marketplace import activity.',
	};
}

function distribution(title: string, description: string, items: DistributionItem[]): DistributionSummaryViewModel {
	return {
		title,
		description,
		items,
		emptyTitle: `No ${title.toLowerCase()} yet`,
		emptyDescription: 'Create, package, publish, install, or import resources to populate this distribution surface.',
	};
}

function overlayStatus(routePattern: string, resourceType: string, signedIn: boolean, teamReady: boolean): OverlayStatusViewModel {
	if (!signedIn) {
		return {
			state: 'requiresSignIn',
			label: 'Sign in required',
			message: 'Overlay editing is only bootstrapped for authorized product readers.',
			routePattern,
			resourceType,
			action: { id: 'overlay.sign-in', label: 'Sign in', state: 'allowed', href: `/auth/sign-in?returnTo=${encodeURIComponent(routePattern)}` },
		};
	}
	if (!teamReady) {
		return { state: 'denied', label: 'Team required', message: 'Select a team before overlay editing can be offered.', routePattern, resourceType };
	}
	return {
		state: 'preview',
		label: 'Overlay gated',
		message: 'Editor and search bundles load only after an authorized edit intent.',
		routePattern,
		resourceType,
		action: { id: 'overlay.intent', label: 'Prepare overlay', state: 'allowed', href: `${routePattern}#overlay` },
	};
}

export async function loadKnowledgeDistributionDashboard(input: any): Promise<KnowledgeDistributionBundle> {
	const vm = await loadKnowledgeViewModel(input);
	const context = vm.context;
	const items = [
		...itemsForKind(vm, 'artifacts').slice(0, 3),
		...itemsForKind(vm, 'releases').slice(0, 2),
		...itemsForKind(vm, 'books').slice(0, 2),
		...itemsForKind(vm, 'capabilities').slice(0, 2),
	];
	const teamReady = Boolean(context.activeTeam);
	const actions = [
		action('knowledge.publish', 'Publish/package', '/app/knowledge/publish', teamReady),
		action('knowledge.imports', 'Review imports', '/app/knowledge/imports', teamReady),
	];
	return {
		context,
		dashboard: {
			title: 'Knowledge distribution',
			description: 'Artifacts, books, releases, capabilities, marketplace listings, imports, and overlay readiness for the active team.',
			context: {
				id: 'knowledge-context',
				title: 'Distribution context',
				items: [
					{ label: 'Active team', value: context.activeTeam ? teamLabel(context.activeTeam) : 'None', tone: context.activeTeam ? 'success' : 'warning' },
					{ label: 'Projects', value: context.projects.length, href: '/app/projects', description: 'Sources for package and publish actions' },
				],
			},
			status: {
				id: 'knowledge-status',
				title: 'Distribution status',
				items: [
					{ label: 'Artifacts', value: vm.artifacts.length, href: '/app/knowledge/artifacts', tone: vm.artifacts.length ? 'success' : 'muted' },
					{ label: 'Releases', value: vm.releases.length, href: '/app/knowledge/releases', tone: vm.releases.length ? 'info' : 'muted' },
					{ label: 'Imports', value: vm.imports.length, href: '/app/knowledge/imports', tone: vm.imports.length ? 'info' : 'muted' },
				],
			},
			nextActions: [
				{ id: 'publish', title: 'Package or publish', description: 'Request export, template, pack, or release actions through the API operation path.', href: '/app/knowledge/publish', status: 'Resolved action' },
				{ id: 'market-packs', title: 'Public knowledge imports', description: 'Review public acquisition surfaces and entitlement-aware install paths.', href: '/market/knowledge-packs', status: 'Marketplace' },
				{ id: 'market-templates', title: 'Workflow imports', description: 'Inspect public workflow import listings and installation readiness.', href: '/market/templates', status: 'Marketplace' },
			],
			primaryResources: Object.entries(collectionLabels).map(([kind, labels]) => ({ id: kind, title: labels.title, description: labels.description, href: `/app/knowledge/${kind === 'artifacts' ? 'artifacts' : kind}` })),
			activity: items.map((item) => ({ id: item.id, title: item.title, description: item.description, href: item.href, tone: dashboardToneFromStatus(item.status), meta: item.meta })),
		},
		distribution: distribution('Distribution highlights', 'Recent resources with entitlement, delivery, and action state resolved.', items),
		actions,
		helpContext: routeHelp('/app/knowledge', 'Knowledge distribution', 'knowledge-distribution', 'dashboard'),
		feedbackContext: routeFeedback(input.url, context, '/app/knowledge', 'Knowledge distribution', 'knowledge-distribution'),
		overlayStatus: overlayStatus('/app/knowledge', 'knowledge-distribution', Boolean(context.principal), teamReady),
	};
}

export async function loadKnowledgeDistributionCollection(input: any, kind: KnowledgeDistributionKind): Promise<KnowledgeCollectionBundle> {
	const vm = await loadKnowledgeViewModel(input);
	const labels = collectionLabels[kind];
	const items = itemsForKind(vm, kind);
	const path = `/app/knowledge/${kind}`;
	const actions = [
		action(`knowledge.${kind}.publish`, 'Publish/package', '/app/knowledge/publish', Boolean(vm.context.activeTeam)),
		action(`knowledge.${kind}.market`, 'Marketplace', kind === 'templates' ? '/market/templates' : '/market/knowledge-packs', true),
	];
	return {
		context: vm.context,
		collection: collectionFromItems(kind, items, input.url),
		distribution: distribution(`${labels.title} distribution`, labels.description, items.slice(0, 6)),
		actions,
		helpContext: routeHelp(path, labels.title, `knowledge-${kind}`, 'collection'),
		feedbackContext: routeFeedback(input.url, vm.context, path, labels.title, `knowledge-${kind}`),
		overlayStatus: overlayStatus(path, `knowledge-${kind}`, Boolean(vm.context.principal), Boolean(vm.context.activeTeam)),
	};
}

export async function loadKnowledgeDistributionDetail(input: any, kind: KnowledgeDistributionKind, slug: string): Promise<KnowledgeDetailBundle> {
	const fullVm = await loadKnowledgeViewModel(input);
	const artifactVm = kind === 'artifacts' ? await loadKnowledgeArtifactViewModel(input, slug) : null;
	const context = fullVm.context;
	const items = itemsForKind(fullVm, kind);
	const projection = kind === 'artifacts' && artifactVm?.artifact
		? itemFromArtifact(artifactVm.artifact)
		: items.find((item) => item.id === slug || item.href?.endsWith(`/${slug}`))
			?? (['book', 'seed-book', 'current-book', 'primary-book'].includes(slug) ? items[0] ?? null : null);
	const title = projection?.title ?? collectionLabels[kind].singular;
	const path = `/app/knowledge/${kind}/${slug}`;
	return {
		context,
		title,
		description: projection?.description ?? `This ${collectionLabels[kind].singular.toLowerCase()} is not available to the active team.`,
		eyebrow: collectionLabels[kind].singular,
		metadata: [
			{ key: 'Status', value: projection?.status ?? 'not found' },
			{ key: 'Entitlement', value: projection?.entitlement ?? 'team' },
			{ key: 'Delivery', value: projection?.delivery ?? 'contentProxy' },
			{ key: 'Policy', value: 'resolved before artifact delivery' },
		],
		distribution: distribution(`${title} delivery`, 'Policy-safe delivery and install/import state for this resource.', projection ? [projection] : []),
		actions: [
			action('distribution.install', 'Install/import', '/app/knowledge/imports', Boolean(context.activeTeam)),
			action('distribution.review', 'Review release', kind === 'releases' ? `${path}/review` : undefined, kind === 'releases' && Boolean(context.activeTeam)),
		],
		helpContext: routeHelp(path, title, `knowledge-${kind}`, 'detail'),
		feedbackContext: routeFeedback(input.url, context, path, title, `knowledge-${kind}`),
		overlayStatus: overlayStatus(path, `knowledge-${kind}`, Boolean(context.principal), Boolean(context.activeTeam)),
		found: Boolean(projection),
	};
}

export async function loadKnowledgePublishSettings(input: any): Promise<KnowledgePublishBundle> {
	const context = await loadAppContext(input);
	const path = '/app/knowledge/publish';
	return {
		context,
		title: 'Publish and package',
		description: 'Request export, template package, knowledge pack, or publish operations for one project.',
		actions: [action('knowledge.publish.submit', 'Submit through API', undefined, Boolean(context.activeTeam))],
		helpContext: routeHelp(path, 'Publish and package', 'knowledge-publish', 'settings'),
		feedbackContext: routeFeedback(input.url, context, path, 'Publish and package', 'knowledge-publish'),
		projects: context.projects.map((project: any) => ({ id: idOf(project, 'project'), label: compact(project?.name, compact(project?.slug, idOf(project, 'project'))) })),
		distribution: distribution('Publish actions', 'Each action is queued through the existing project operation API path.', [
			{ id: 'export', title: 'Export bundle', status: 'draft', entitlement: 'team', delivery: 'contentProxy', meta: 'share/export' },
			{ id: 'template', title: 'Package workflow import', status: 'draft', entitlement: 'team', delivery: 'contentProxy', meta: 'share/package-template' },
			{ id: 'pack', title: 'Package knowledge import', status: 'draft', entitlement: 'team', delivery: 'contentProxy', meta: 'share/package-knowledge-pack' },
			{ id: 'publish', title: 'Publish release', status: 'review', entitlement: 'team', delivery: 'contentProxy', meta: 'share/publish' },
		]),
	};
}

export async function loadSellerDashboard(input: any): Promise<KnowledgeDistributionBundle> {
	const context = await loadAppContext(input);
	const path = '/app/market/seller';
	const items: DistributionItem[] = [
		{ id: 'profile', title: 'Seller profile', description: 'Team publisher identity for public listings.', status: context.activeTeam ? 'review' : 'blocked', entitlement: 'team', delivery: 'queued', href: '/app/teams' },
		{ id: 'listings', title: 'Listings', description: 'Knowledge packs, workflow imports, and capabilities awaiting review.', status: 'draft', entitlement: 'team', delivery: 'queued', href: '/app/knowledge' },
	];
	return {
		context,
		dashboard: {
			title: 'Seller dashboard',
			description: 'Publisher readiness for listings, release review, install/download audit, and policy-filtered notifications.',
			context: { id: 'seller-context', title: 'Seller context', items: [{ label: 'Team', value: context.activeTeam ? teamLabel(context.activeTeam) : 'None', tone: context.activeTeam ? 'success' : 'warning' }] },
			status: { id: 'seller-status', title: 'Listing readiness', items: [{ label: 'Listings', value: items.length, href: '/app/knowledge' }, { label: 'Reviews', value: 0, href: '/app/knowledge/releases' }] },
			nextActions: [{ id: 'publish', title: 'Package a listing', description: 'Create a template, pack, capability, or release review request.', href: '/app/knowledge/publish' }],
		},
		distribution: distribution('Seller readiness', 'Public listing and entitlement readiness for the active team.', items),
		actions: [action('seller.publish', 'Package listing', '/app/knowledge/publish', Boolean(context.activeTeam))],
		helpContext: routeHelp(path, 'Seller dashboard', 'seller', 'dashboard'),
		feedbackContext: routeFeedback(input.url, context, path, 'Seller dashboard', 'seller'),
		overlayStatus: overlayStatus(path, 'seller', Boolean(context.principal), Boolean(context.activeTeam)),
	};
}

export async function loadPublicMarketplaceCollection(input: any, kind: 'knowledge-packs' | 'templates'): Promise<PublicMarketplaceCollectionBundle> {
	const path = `/market/${kind}`;
	const rawItems = kind === 'knowledge-packs' ? await listMarketplaceKnowledgePacks(input) : (await listMarketplaceSiteTemplates(input)).items;
	const items: DistributionItem[] = safeArray(rawItems).map((entry: any) => {
		const slug = compact(entry?.slug, idOf(entry, 'listing'));
		const href = `/market/${kind}/${encodeURIComponent(slug)}`;
		return {
			id: slug,
			title: compact(entry?.name, compact(entry?.title, 'Marketplace listing')),
			description: compact(entry?.summary, compact(entry?.description, 'Reusable TreeSeed distribution listing')),
			status: 'published',
			href,
			entitlement: entitlementFrom(entry, 'public'),
			delivery: 'cdn',
			meta: compact(entry?.category, kind === 'templates' ? 'workflow import' : 'knowledge import'),
			action: { id: 'market.install', label: 'Install/import', state: 'requiresEntitlement', href, entitlement: entitlementFrom(entry, 'public'), delivery: 'cdn' },
		};
	});
	const labels = kind === 'templates' ? collectionLabels.templates : collectionLabels.packs;
	return {
		collection: collectionFromItems(kind === 'templates' ? 'templates' : 'packs', items, input.url),
		distribution: distribution(labels.title, labels.description, items),
		actions: [{ id: 'market.browse', label: 'Browse', state: 'allowed', href: path }],
		helpContext: routeHelp(path, labels.title, kind, 'collection'),
		feedbackContext: routeFeedback(input.url, null, path, labels.title, kind),
	};
}

export async function loadPublicMarketplaceDetail(input: any, kind: 'knowledge-packs' | 'templates', slug: string): Promise<PublicMarketplaceDetailBundle> {
	const path = `/market/${kind}/${slug}`;
	if (kind === 'templates') {
		const template = await resolveMarketplaceSiteTemplate(input, slug);
		const item = template.item;
		const title = compact(item?.title, 'Workflow import');
		return {
			title,
			description: compact(item?.description, 'Workflow import detail'),
			eyebrow: 'Workflow Import',
			metadata: [
				{ key: 'Entitlement', value: entitlementFrom(item, 'public') },
				{ key: 'Delivery', value: 'CDN after policy resolution' },
				{ key: 'Import version', value: compact(item?.compatibility?.templateVersion, 'unknown') },
				{ key: 'Fulfillment', value: compact(item?.fulfillment?.mode, 'unknown') },
			],
			distribution: distribution(title, 'Entitlement-aware install/import state for this workflow import.', item ? [{ id: slug, title, description: item.description, status: 'published', entitlement: entitlementFrom(item, 'public'), delivery: 'cdn', meta: compact(item?.category, 'workflow import') }] : []),
			actions: [{ id: 'market.template.install', label: 'Install/import', state: item ? 'requiresEntitlement' : 'disabledWithReason', href: item ? `/auth/sign-in?returnTo=${encodeURIComponent(path)}` : undefined, reason: item ? undefined : 'Listing unavailable.' }],
			helpContext: routeHelp(path, title, 'market-template', 'detail'),
			feedbackContext: routeFeedback(input.url, null, path, title, 'market-template'),
			found: Boolean(template.rendered && item),
			templateItem: item,
		};
	}
	const { entry, artifacts } = await resolveMarketplaceCatalogItem(input, 'knowledge_pack', slug);
	const title = compact(entry?.title, 'Knowledge import');
	return {
		title,
		description: compact(entry?.summary, 'Knowledge import detail'),
		eyebrow: 'Knowledge Import',
		metadata: [
			{ key: 'Entitlement', value: entitlementFrom(entry, 'public') },
			{ key: 'Offer mode', value: describeState(entry?.offerMode, 'unknown') },
			{ key: 'Delivery', value: 'CDN or content proxy after entitlement validation' },
			{ key: 'Artifact versions', value: String(safeArray(artifacts).length) },
		],
		distribution: distribution(title, 'Published artifact versions are exposed only through resolved delivery actions.', safeArray(artifacts).map((artifact: any) => ({
			id: compact(artifact?.version, 'version'),
			title: compact(artifact?.version, 'Artifact version'),
			description: compact(artifact?.kind, 'Catalog artifact'),
			status: 'published',
			entitlement: entitlementFrom(entry, 'public'),
			delivery: 'cdn',
			meta: compact(artifact?.publishedAt, 'published'),
		}))),
		actions: [{ id: 'market.pack.install', label: 'Install/import', state: entry ? 'requiresEntitlement' : 'disabledWithReason', href: entry ? `/auth/sign-in?returnTo=${encodeURIComponent(path)}` : undefined, reason: entry ? undefined : 'Listing unavailable.' }],
		helpContext: routeHelp(path, title, 'market-knowledge-pack', 'detail'),
		feedbackContext: routeFeedback(input.url, null, path, title, 'market-knowledge-pack'),
		found: Boolean(entry),
	};
}

import type { DashboardViewModel, FeedbackContext, HelpContext, ResolvedAction } from '@treeseed/ui';
import { ApiClientFacade } from '../lib/market/api-client';
import type { OperationalContext } from './shared';

function metric(label: string, value: string | number, description?: string, href?: string) {
	return { label, value, description, href };
}

function help(input: { capabilityId: string; title: string; path: string; resourceType: string; context: 'team' | 'admin' | 'market' }): HelpContext {
	return {
		capabilityId: input.capabilityId,
		topicIds: [input.capabilityId],
		shell: 'product',
		context: input.context,
		resourceType: input.resourceType,
		routePattern: input.path,
		canonicalPath: input.path,
		template: 'dashboard',
		summary: `${input.title} uses canonical ProductShell dashboards with policy-shaped API data and resolved actions.`,
		topics: [{
			id: input.capabilityId,
			title: input.title,
			summary: `${input.title} uses canonical ProductShell dashboards with policy-shaped API data and resolved actions.`,
			visibility: 'team',
			source: 'capability',
		}],
		relatedDocs: [{
			topicId: input.capabilityId,
			title: input.title,
			href: input.path,
			visibility: 'team',
			source: 'capability',
			current: true,
		}],
		relatedActions: [],
		searchScope: 'team',
		visibility: 'team',
		feedbackType: 'question',
	};
}

function feedback(input: { capabilityId: string; title: string; path: string; resourceType: string; teamId?: string }): FeedbackContext {
	return {
		url: input.path,
		canonicalPath: input.path,
		title: input.title,
		capabilityId: input.capabilityId,
		shell: 'product',
		context: input.teamId ? 'team' : 'admin',
		teamId: input.teamId,
		resourceType: input.resourceType,
		submissionEndpoint: '/v1/feedback',
		allowAnonymous: false,
		screenshotPolicy: 'optional',
		attachmentStoragePolicy: 'private',
		routePattern: input.path,
		policy: input.teamId ? 'team' : 'admin',
		source: 'page',
	};
}

export function canManageTeamCommerce(access: any): boolean {
	const manageableRoles = new Set(['team_owner', 'project_lead']);
	return Boolean(access?.roles?.some((role: string) => manageableRoles.has(role)));
}

export async function loadCommonsGovernanceDashboard(Astro: any, context: OperationalContext) {
	const api = new ApiClientFacade(Astro);
	const [summary, proposals, questions, decisions, events] = await Promise.all([
		api.getCommonsSummary().catch(() => null),
		api.listCommonsProposals({ limit: 8 }).catch(() => []),
		api.listCommonsQuestions({ limit: 8 }).catch(() => []),
		api.listCommonsDecisions({ limit: 8 }).catch(() => []),
		api.listCommonsEvents({ limit: 12 }).catch(() => []),
	]);
	const dashboard: DashboardViewModel = {
		title: 'TreeSeed Commons',
		description: 'Operate participant questions, proposals, voting, and bounded steward decisions.',
		context: {
			id: 'commons-signal',
			title: 'Commons signal',
			description: 'Participation counts are advisory capacity signals, not legal membership or payout governance.',
			items: [
				metric('Active participants', summary?.counts?.activeParticipants ?? 0, undefined, '/app/commons/participants'),
				metric('Active proposals', summary?.counts?.activeProposals ?? 0, undefined, '/app/commons/proposals'),
				metric('Open questions', summary?.counts?.openQuestions ?? 0, undefined, '/app/commons/questions'),
				metric('Accepted decisions', summary?.counts?.acceptedDecisions ?? 0, undefined, '/app/commons/decisions'),
			],
		},
		primaryResources: proposals.map((proposal: any) => ({
			id: String(proposal.id),
			title: String(proposal.title ?? proposal.id),
			description: String(proposal.summary ?? 'No summary supplied yet.'),
			href: `/app/commons/proposals/${encodeURIComponent(String(proposal.id))}`,
			status: String(proposal.status ?? 'draft'),
			meta: String(proposal.scope ?? 'treeseed commons'),
		})),
		activity: events.map((event: any) => ({
			id: String(event.id ?? `${event.eventType}-${event.createdAt}`),
			title: String(event.eventType ?? 'Governance event'),
			description: String(event.nextState ?? ''),
			timestamp: event.createdAt,
			tone: 'info',
		})),
	};
	const actions: ResolvedAction[] = [
		{ id: 'commons.backfill', label: 'Backfill participants', state: 'allowed', method: 'POST' },
		{ id: 'commons.participants', label: 'Participants', state: 'allowed', href: '/app/commons/participants' },
	];
	return {
		context,
		dashboard,
		actions,
		proposals,
		questions,
		decisions,
		events,
		helpContext: help({ capabilityId: 'commons.steward-dashboard', title: 'Commons stewardship', path: '/app/commons', resourceType: 'commons-governance', context: 'admin' }),
		feedbackContext: feedback({ capabilityId: 'commons.steward-dashboard', title: 'Commons stewardship', path: '/app/commons', resourceType: 'commons-governance' }),
	};
}

export function buildTeamCommerceDashboard(input: {
	path: string;
	team: any;
	vendor: any | null;
	stripeAccount: any | null;
	commerceMonitor: any | null;
	canManageTeam: boolean;
	formError?: string;
	statusMessage?: string;
}) {
	const readiness = input.vendor?.salesEnabled && input.stripeAccount?.accountStatus === 'enabled' ? 'ready' : input.vendor ? 'setup' : 'not requested';
	const dashboard: DashboardViewModel = {
		title: 'Commerce settings',
		description: 'Manage seller readiness, Stripe status, ownership evidence, and marketplace governance for this team.',
		context: {
			id: 'seller-readiness',
			title: 'Seller readiness',
			description: 'Seller approval, payment readiness, and cooperative ownership records are tracked separately.',
			items: [
				metric('Vendor status', input.vendor?.status ?? 'not requested'),
				metric('Trust level', input.vendor?.trustLevel ?? 'none'),
				metric('Sales enabled', input.vendor?.salesEnabled ? 'yes' : 'no'),
				metric('Stripe status', input.stripeAccount?.accountStatus ?? 'not linked'),
			],
		},
		status: {
			id: 'payment-readiness',
			title: 'Payment readiness',
			items: [
				metric('Charges', input.stripeAccount?.chargesEnabled ? 'enabled' : 'not enabled'),
				metric('Payouts', input.stripeAccount?.payoutsEnabled ? 'enabled' : 'not enabled'),
				metric('Requirements due', input.stripeAccount?.requirementsCurrentlyDue?.length ?? 0),
				metric('Overall', readiness),
			],
		},
		alerts: [
			...(input.formError ? [{ id: 'form-error', title: 'Action failed', description: input.formError, tone: 'danger' as const }] : []),
			...(input.statusMessage ? [{ id: 'status', title: 'Saved', description: input.statusMessage, tone: 'success' as const }] : []),
		],
	};
	const actions: ResolvedAction[] = input.canManageTeam
		? [
			{ id: 'commerce.request-vendor', label: 'Request seller capability', state: input.vendor ? 'hidden' : 'allowed', method: 'POST' },
			{ id: 'commerce.connect-stripe', label: input.stripeAccount?.accountStatus === 'enabled' ? 'Update Stripe' : 'Connect Stripe', state: input.vendor?.status === 'approved' ? 'allowed' : 'requiresSetup', method: 'POST' },
			{ id: 'commerce.refresh-status', label: 'Refresh status', state: input.vendor?.status === 'approved' ? 'allowed' : 'requiresSetup', method: 'POST' },
		]
		: [{ id: 'commerce.readonly', label: 'Seller readiness', state: 'readOnly', reason: 'Team manager access is required.' }];
	return {
		dashboard,
		actions,
		helpContext: help({ capabilityId: 'commerce.team-settings', title: 'Team commerce settings', path: input.path, resourceType: 'commerce-vendor', context: 'team' }),
		feedbackContext: feedback({ capabilityId: 'commerce.team-settings', title: 'Team commerce settings', path: input.path, resourceType: 'commerce-vendor', teamId: input.team?.id }),
		commerceMonitor: input.commerceMonitor,
	};
}

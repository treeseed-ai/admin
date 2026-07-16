import type { DashboardViewModel, ResolvedAction } from '@treeseed/ui';
import { compact, safeArray, teamLabel, type OperationalContext } from './shared.js';

interface DashboardBundle {
	viewModel: DashboardViewModel;
	actions: ResolvedAction[];
}

function principalName(principal: any) {
	return compact(principal?.displayName, compact(principal?.email, 'Signed-in account'));
}

export function buildPersonalDashboard(context: OperationalContext): DashboardBundle {
	const activeTeam = context.activeTeam;
	return {
		viewModel: {
			title: 'Account and teams',
			description: 'Manage your identity, team memberships, and active team.',
			context: {
				id: 'identity-context',
				title: 'Signed-in identity',
				items: [
					{ label: 'Account', value: principalName(context.principal), description: compact(context.principal?.email, 'Authenticated') },
					{ label: 'Active team', value: activeTeam ? teamLabel(activeTeam) : 'None selected', tone: activeTeam ? 'success' : 'warning' },
					{ label: 'Available teams', value: context.teams.length, href: '/app/teams' },
				],
			},
			status: {
				id: 'identity-status',
				title: 'Identity status',
				items: [
					{ label: 'Session', value: 'Active', tone: 'success', href: '/app/account' },
					{ label: 'Team context', value: activeTeam ? 'Selected' : 'Needs selection', tone: activeTeam ? 'success' : 'warning', href: '/app/teams' },
				],
			},
			nextActions: [
				{ id: 'account', title: 'Review account settings', description: 'Update profile, email, password, appearance, and active sessions.', href: '/app/account', status: 'Account' },
				activeTeam
					? { id: 'team', title: `Manage ${teamLabel(activeTeam)}`, description: 'Review team settings and membership.', href: `/app/teams/${encodeURIComponent(activeTeam.id)}/edit`, status: 'Active team' }
					: { id: 'team-new', title: 'Create your first team', description: 'A team establishes the shared identity and membership boundary.', href: '/app/teams/new', status: 'Required' },
			],
			primaryResources: context.teams.map((team: any) => ({
				id: compact(team?.id, compact(team?.name, 'team')),
				title: teamLabel(team),
				description: team?.id === activeTeam?.id ? 'Current active team' : 'Available team',
				href: `/app/teams/${encodeURIComponent(team.id)}/edit`,
				status: team?.id === activeTeam?.id ? 'Active' : 'Available',
			})),
			activity: [],
		},
		actions: [
			{ id: 'account.manage', label: 'Manage account', state: 'allowed', href: '/app/account' },
			{ id: 'team.create', label: 'Create team', state: 'allowed', href: '/app/teams/new' },
		],
	};
}

export async function buildTeamDashboard(context: OperationalContext): Promise<DashboardBundle> {
	const activeTeam = context.activeTeam;
	const members = activeTeam && context.store?.listTeamMembers
		? safeArray(await context.store.listTeamMembers(activeTeam.id).catch(() => []))
		: [];
	return {
		viewModel: {
			title: 'Teams',
			description: 'Choose the active team and manage team identity and membership.',
			context: {
				id: 'team-context',
				title: 'Team context',
				items: [
					{ label: 'Active team', value: activeTeam ? teamLabel(activeTeam) : 'None', tone: activeTeam ? 'success' : 'warning' },
					{ label: 'Available teams', value: context.teams.length },
					{ label: 'Active-team members', value: members.length, href: activeTeam ? `/app/teams/${encodeURIComponent(activeTeam.id)}/members` : undefined },
				],
			},
			status: {
				id: 'team-status',
				title: 'Management',
				items: activeTeam ? [
					{ label: 'Settings', value: 'Available', href: `/app/teams/${encodeURIComponent(activeTeam.id)}/edit` },
					{ label: 'Membership', value: `${members.length} members`, href: `/app/teams/${encodeURIComponent(activeTeam.id)}/members` },
				] : [{ label: 'Team setup', value: 'Create a team', href: '/app/teams/new', tone: 'warning' }],
			},
			nextActions: activeTeam ? [
				{ id: 'settings', title: 'Edit team settings', description: 'Manage the active team identity.', href: `/app/teams/${encodeURIComponent(activeTeam.id)}/edit`, status: 'Settings' },
				{ id: 'members', title: 'Manage members', description: 'Invite members and maintain roles.', href: `/app/teams/${encodeURIComponent(activeTeam.id)}/members`, status: 'Membership' },
			] : [{ id: 'create', title: 'Create a team', description: 'Create the first shared team context.', href: '/app/teams/new', status: 'Required' }],
			primaryResources: context.teams.map((team: any) => ({
				id: compact(team?.id, compact(team?.name, 'team')),
				title: teamLabel(team),
				description: compact(team?.profileSummary, team?.id === activeTeam?.id ? 'Current active team' : 'Available team'),
				href: `/app/teams/${encodeURIComponent(team.id)}/edit`,
				status: team?.id === activeTeam?.id ? 'Active' : 'Available',
			})),
			activity: [],
		},
		actions: [{ id: 'team.create', label: 'Create team', state: 'allowed', href: '/app/teams/new' }],
	};
}

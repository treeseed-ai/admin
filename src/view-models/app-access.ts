import { loadAccessibleTeams, resolveApiStore, resolveMarketPrincipal } from '../lib/market/store.js';
import { compact, safeArray, type OperationalContext } from './shared.js';

export type AppAccessStatus = 'found' | 'not_found' | 'forbidden' | 'unavailable';

export interface AppResolution<T = any> {
	resource: T | null;
	details: any | null;
	team: any | null;
	status: AppAccessStatus;
}

function teamMatches(team: any, value: string) {
	return team?.id === value || team?.slug === value || team?.name === value || team?.displayName === value;
}

export async function loadAppContext(input: any, fallbackAstro?: any): Promise<OperationalContext> {
	const astro = input?.locals ? input : fallbackAstro;
	const locals = input?.locals ?? input;
	const marketContext = astro ?? locals;
	const store = resolveApiStore(marketContext);
	const principal = resolveMarketPrincipal(locals);
	let teams: any[] = [];
	let teamsStatus: OperationalContext['teamsStatus'] = 'ready';
	let teamsError: string | null = null;
	try {
		teams = safeArray(await loadAccessibleTeams(marketContext));
	} catch (error) {
		teamsStatus = 'unavailable';
		teamsError = error instanceof Error ? error.message : 'Team service is unavailable.';
	}
	const cookieTeamId = compact(astro?.cookies?.get?.('treeseed_active_team')?.value, '');
	const selectableTeams = teams.filter((team: any) => (team.status ?? 'active') === 'active');
	const activeTeam = selectableTeams.find((team: any) => teamMatches(team, cookieTeamId)) ?? null;
	return { store, principal, teams, activeTeam, teamsStatus, teamsError };
}

export async function resolveAppTeam(context: OperationalContext, teamParam: unknown): Promise<AppResolution> {
	const param = compact(teamParam, '');
	if (!param) return { resource: null, details: null, team: null, status: 'not_found' };
	if ((param === 'current' || param === 'active') && context.activeTeam) {
		return { resource: context.activeTeam, details: null, team: context.activeTeam, status: 'found' };
	}
	const team = safeArray(context.teams).find((entry: any) => teamMatches(entry, param)) ?? null;
	if (team) return { resource: team, details: null, team, status: 'found' };
	try {
		const result = await context.store.request('GET', `/v1/teams/${encodeURIComponent(param)}/access`);
		return { resource: result.team, details: result.access, team: result.team, status: 'found' };
	} catch (error) {
		const status = Number((error as any)?.status ?? 503);
		return {
			resource: null,
			details: null,
			team: null,
			status: status === 403 ? 'forbidden' : status === 404 ? 'not_found' : 'unavailable',
		};
	}
}

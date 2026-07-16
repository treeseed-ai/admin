import { loadAccessibleTeams, resolveApiStore, resolveMarketPrincipal } from '../lib/market/store.js';
import { compact, safeArray, type OperationalContext } from './shared.js';

export type AppAccessStatus = 'found' | 'not_found' | 'forbidden';

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
	const teams = safeArray(await loadAccessibleTeams(marketContext).catch(() => []));
	const cookieTeamId = compact(astro?.cookies?.get?.('treeseed_active_team')?.value, '');
	const activeTeam = teams.find((team: any) => teamMatches(team, cookieTeamId)) ?? teams[0] ?? null;
	return { store, principal, teams, activeTeam };
}

export function persistActiveTeamSelection(astro: any, team: any | null) {
	if (!team?.id || !astro?.cookies?.set) return;
	astro.cookies.set('treeseed_active_team', team.id, {
		path: '/app',
		httpOnly: false,
		sameSite: 'lax',
		secure: astro.url?.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 365,
	});
}

export function resolveAppTeam(context: OperationalContext, teamParam: unknown): AppResolution {
	const param = compact(teamParam, '');
	if (!param) return { resource: null, details: null, team: null, status: 'not_found' };
	if ((param === 'current' || param === 'active') && context.activeTeam) {
		return { resource: context.activeTeam, details: null, team: context.activeTeam, status: 'found' };
	}
	const team = safeArray(context.teams).find((entry: any) => teamMatches(entry, param)) ?? null;
	return team
		? { resource: team, details: null, team, status: 'found' }
		: { resource: null, details: null, team: null, status: 'not_found' };
}

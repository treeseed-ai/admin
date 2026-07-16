export interface OperationalContext {
	store: any | null;
	principal: any | null;
	teams: any[];
	activeTeam: any | null;
}

export function safeArray<T = any>(value: unknown): T[] {
	return Array.isArray(value) ? value as T[] : [];
}

export function compact(value: unknown, fallback = ''): string {
	return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function teamLabel(team: any | null): string {
	return compact(team?.displayName, compact(team?.name, compact(team?.slug, 'Team')));
}

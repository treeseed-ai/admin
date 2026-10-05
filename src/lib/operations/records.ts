export type JsonRecord = Record<string, any>;

export function record(value: unknown): JsonRecord {
	return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

export function items(value: unknown): JsonRecord[] {
	if (Array.isArray(value)) return value.filter((entry): entry is JsonRecord => Boolean(entry && typeof entry === 'object'));
	const candidate = record(value);
	return Array.isArray(candidate.items)
		? candidate.items.filter((entry: unknown): entry is JsonRecord => Boolean(entry && typeof entry === 'object'))
		: [];
}

export function text(...values: unknown[]): string {
	for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
	return '';
}

export function numberValue(value: unknown, fallback = 0): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function dateValue(...values: unknown[]): string | null {
	for (const value of values) {
		if (typeof value === 'string' && Number.isFinite(Date.parse(value))) return value;
	}
	return null;
}

export function statusTone(status: unknown): 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'default' {
	const value = String(status ?? '').toLowerCase();
	if (['active', 'accepted', 'approved', 'completed', 'implemented', 'running', 'succeeded'].includes(value)) return 'success';
	if (['blocked', 'degraded', 'pending', 'queued', 'under_review', 'voting', 'waiting', 'warning'].includes(value)) return 'warning';
	if (['cancelled', 'error', 'failed', 'rejected', 'revoked'].includes(value)) return 'danger';
	if (['draft', 'open', 'planning', 'submitted'].includes(value)) return 'info';
	if (['archived', 'closed', 'dormant'].includes(value)) return 'muted';
	return 'default';
}

export function safeReturnTo(value: unknown, fallback: string): string {
	const candidate = text(value);
	return candidate.startsWith('/app/') && !candidate.startsWith('//') ? candidate : fallback;
}

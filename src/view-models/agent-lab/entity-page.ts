import type { AgentLabEntityKind, AgentLabEntitySummary } from '@treeseed/sdk/agent-capacity';
import type { APIContext } from 'astro';
import { ApiClientFacade } from '../../lib/market/api-client.ts';
import { loadAppContext } from '../app-access.ts';
import { loadAgentLabFrame } from './agent-lab-frame.ts';

export async function loadAgentLabEntityPage(context: APIContext, kind: AgentLabEntityKind) {
	const app = await loadAppContext(context); const api = new ApiClientFacade(context);
	const preferences = await api.accountPreferences().catch(() => ({ timeZone: 'UTC', realTimeUpdates: true, realTimePollingIntervalSeconds: 5 as const }));
	if (!app.activeTeam) return { app, preferences, monitor: null, items: [] as AgentLabEntitySummary[], total: 0, query: '', status: '', nextHref: undefined };
	const query = context.url.searchParams.get('q') ?? ''; const status = context.url.searchParams.get('status') ?? ''; const cursor = context.url.searchParams.get('cursor') ?? '';
	const date = context.url.searchParams.get('date'); const workday = context.url.searchParams.get('workday');
	const params = new URLSearchParams({ kind, limit: '25' }); if (query) params.set('q', query); if (status) params.set('status', status); if (cursor) params.set('cursor', cursor);
	if (date) params.set('date', date); if (workday) params.set('workday', workday);
	const [monitor, page] = await Promise.all([
		loadAgentLabFrame(api, app.activeTeam, preferences, { date, workday }),
		api.request('GET', `/v1/teams/${encodeURIComponent(app.activeTeam.id)}/agent-lab/entities?${params}`).catch(() => ({ items: [], total: 0 })),
	]);
	const payload = page as { items?: AgentLabEntitySummary[]; total?: number; page?: { nextCursor?: string | null } };
	const next = new URLSearchParams(); if (query) next.set('q', query); if (status) next.set('status', status); if (date) next.set('date', date); if (workday) next.set('workday', workday);
	if (payload.page?.nextCursor) next.set('cursor', payload.page.nextCursor);
	return { app, preferences, monitor, items: payload.items ?? [], total: Number(payload.total ?? 0), query, status,
		nextHref: payload.page?.nextCursor ? `${context.url.pathname}?${next}` : undefined };
}

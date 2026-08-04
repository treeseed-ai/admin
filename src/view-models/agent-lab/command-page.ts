import type { CommandCollectionPage } from '@treeseed/ui/components/react/CommandCenter';
import type { APIContext } from 'astro';
import { ApiClientFacade } from '../../lib/market/api-client.ts';
import { loadAppContext } from '../app-access.ts';
import { loadAgentLabFrame } from './agent-lab-frame.ts';

export type AgentLabCommandSurface = CommandCollectionPage['surface'];
const copy: Record<AgentLabCommandSurface, { title: string; description: string }> = {
	inbox: { title: 'Operational Inbox', description: 'Governance and failures that can change what the team does next.' },
	decisions: { title: 'Decision Chamber', description: 'Open proposals beside the durable decisions and work they authorize.' },
	build: { title: 'Agent Systems Foundry', description: 'Inspect repository-defined agents, their contracts, and production simulations.' },
	direction: { title: 'Execution Direction', description: 'Follow work from assignment intake through execution-provider evidence and outcomes.' },
	results: { title: 'Result Intelligence', description: 'Research outcomes, generated content, changed files, costs, and recovery evidence.' },
	find: { title: 'Relationship Search', description: 'Search operational records and follow how governance, agents, work, and evidence connect.' },
};
function fallback(surface: AgentLabCommandSurface): CommandCollectionPage { return { revision: 'unavailable', generatedAt: new Date().toISOString(), surface, ...copy[surface], unreadCount: 0, items: [], secondaryItems: [], metrics: [], relations: [], page: { hasMore: false, nextCursor: null, total: 0 } }; }
export async function loadAgentLabCommandPage(context: APIContext, surface: AgentLabCommandSurface) {
	const app = await loadAppContext(context); const api = new ApiClientFacade(context);
	const preferences = await api.accountPreferences().catch(() => ({ timeZone: 'UTC', realTimeUpdates: true, realTimePollingIntervalSeconds: 5 as const }));
	if (!app.activeTeam) return { app, preferences, frame: null, surface: fallback(surface), endpoints: null, query: '' };
	const date = context.url.searchParams.get('date'); const workday = context.url.searchParams.get('workday'); const query = context.url.searchParams.get('q') ?? '';
	const selection = new URLSearchParams(); if (date) selection.set('date', date); if (workday) selection.set('workday', workday); if (query) selection.set('q', query);
	const base = `/v1/teams/${encodeURIComponent(app.activeTeam.id)}/agent-lab`; const collection = `${base}/surfaces/${surface}${selection.size ? `?${selection}` : ''}`;
	const [frame, initial] = await Promise.all([loadAgentLabFrame(api, app.activeTeam, preferences, { date, workday }), api.request('GET', collection).catch(() => fallback(surface))]);
	return { app, preferences, frame, surface: initial as CommandCollectionPage, query, endpoints: { collection, detailBase: `${base}/details`, state: `${base}/view-state`, actions: `${base}/surfaces/${surface}`, simulations: `${base}/simulations` } };
}

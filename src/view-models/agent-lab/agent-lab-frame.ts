import { agentLabMetricKeys, type AgentLabActivityInterval, type AgentLabDelta, type AgentLabMetricPoint, type AgentLabOverview } from '@treeseed/sdk/agent-capacity';
import type { AccountPreferences } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../lib/market/api-client.ts';

export const agentLabMetricDestinations = {
	agents: '/app/work/agents', workdays: '/app/work/workdays', systemEvents: '/app/work/events',
	assignments: '/app/work/assignments', executions: '/app/work/executions', artifacts: '/app/work/artifacts',
	passed: '/app/work/executions?status=succeeded', failed: '/app/work/executions?status=failed', running: '/app/work/executions?status=running',
};

function fallbackOverview(team: { id: string; name?: string; slug?: string }, timeZone: string): AgentLabOverview {
	const now = new Date(); const start = new Date(now); start.setUTCHours(0, 0, 0, 0); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
	return { revision: 'server-snapshot-unavailable', generatedAt: now.toISOString(), timeZone, operatingDay: { start: start.toISOString(), end: end.toISOString() },
		team: { id: team.id, name: team.name ?? team.slug ?? 'Active team' }, connectivity: 'degraded', activeWorkdays: 0, activeProviders: 0, executionProviders: [],
		workdayContext: { selectedDate: now.toISOString().slice(0, 10), selectedWorkdayId: null, latestWorkdayId: null, workdays: [] }, metricTargets: {}, targetRevision: null,
		metrics: agentLabMetricKeys.map((key) => ({ key, value: 0, secondary: 'Unavailable', semantic: key === 'agents' ? 'configured' : ['workdays', 'systemEvents'].includes(key) ? 'exact-total' : key === 'running' ? 'instantaneous' : 'cumulative', observedAt: now.toISOString() })) };
}

export async function loadAgentLabFrame(api: ApiClientFacade, team: { id: string; name?: string; slug?: string }, preferences: AccountPreferences, selection: { date?: string | null; workday?: string | null } = {}) {
	const base = `/v1/teams/${encodeURIComponent(team.id)}/agent-lab`;
	const query = new URLSearchParams(); if (selection.date) query.set('date', selection.date); if (selection.workday) query.set('workday', selection.workday);
	const suffix = query.size ? `?${query}` : '';
	const [overview, activity, series, allocation] = await Promise.all([
		api.request('GET', `${base}/overview${suffix}`).catch(() => fallbackOverview(team, preferences.timeZone)),
		api.request('GET', `${base}/activity${suffix}`).catch(() => ({ revision: 'unavailable', generatedAt: new Date().toISOString(), cursor: null, upserts: [], removedIds: [] })),
		api.request('GET', `${base}/metric-series${suffix}`).catch(() => ({ revision: 'unavailable', generatedAt: new Date().toISOString(), cursor: null, upserts: [], removedIds: [] })),
		api.request('GET', `${base}/allocation${suffix}`).catch(() => ({ revision: 'unavailable', generatedAt: new Date().toISOString(), canManage: false, activeAllocationSetId: null, time: { availableSeconds: null, requestedSeconds: 0, reservedSeconds: 0, activeSeconds: 0, elapsedSeconds: 0, releasedSeconds: 0, remainingSeconds: null, overrunSeconds: 0 }, projects: [], agentClasses: [], workdayTime: [] })),
	]);
	return {
		overview: overview as AgentLabOverview,
		activity: activity as AgentLabDelta<AgentLabActivityInterval>,
		series: series as AgentLabDelta<AgentLabMetricPoint>,
		allocation,
		endpoints: { overview: `${base}/overview${suffix}`, activity: `${base}/activity${suffix}`, metricSeries: `${base}/metric-series${suffix}`, allocation: `${base}/allocation${suffix}` },
		targetEndpoint: `${base}/targets`,
		preference: { enabled: preferences.realTimeUpdates, intervalSeconds: preferences.realTimePollingIntervalSeconds },
	};
}

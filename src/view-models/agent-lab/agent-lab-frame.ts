import { agentLabMetricKeys, type AgentAtlasProjection, type AgentLabActivityInterval, type AgentLabDelta, type AgentLabMetricPoint, type AgentLabOverview } from '@treeseed/sdk/agent-capacity';
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

function fallbackAtlas(teamId:string,overview:AgentLabOverview):AgentAtlasProjection{return{revision:'server-snapshot-unavailable',generatedAt:overview.generatedAt,timeZone:overview.timeZone,scope:{teamId,selectedDate:overview.workdayContext.selectedDate,workdayIds:[],projectIds:[],groupIds:[],agentIds:[],activityProfiles:[],sizingMetric:'activity'},topologies:[],nodeStates:[],assignments:[],activity:[],playback:{mode:'live',startedAt:overview.operatingDay.start,endedAt:overview.operatingDay.end,liveEdgeAt:overview.generatedAt,cursor:{cursor:null,observedAt:overview.generatedAt,positions:{}}},alerts:[{id:'atlas-unavailable',severity:'warning',message:'The Agent Atlas projection is temporarily unavailable.'}]}}

export async function loadAgentLabFrame(api: ApiClientFacade, team: { id: string; name?: string; slug?: string }, preferences: AccountPreferences, selection: { date?: string | null; workday?: string | null } = {}) {
	const base = `/v1/teams/${encodeURIComponent(team.id)}/agent-lab`;
	const query = new URLSearchParams(); if (selection.date) query.set('date', selection.date); if (selection.workday) query.set('workday', selection.workday);
	const suffix = query.size ? `?${query}` : '';
	const overview=await api.request('GET', `${base}/overview${suffix}`).catch(() => fallbackOverview(team, preferences.timeZone)) as AgentLabOverview;
	const [activity, series, allocation,atlas] = await Promise.all([
		api.request('GET', `${base}/activity${suffix}`).catch(() => ({ revision: 'unavailable', generatedAt: new Date().toISOString(), cursor: null, upserts: [], removedIds: [] })),
		api.request('GET', `${base}/metric-series${suffix}`).catch(() => ({ revision: 'unavailable', generatedAt: new Date().toISOString(), cursor: null, upserts: [], removedIds: [] })),
		api.request('GET', `${base}/allocation${suffix}`).catch(() => ({ revision: 'unavailable', generatedAt: new Date().toISOString(), canManage: false, activeAllocationSetId: null, time: { availableSeconds: null, requestedSeconds: 0, reservedSeconds: 0, activeSeconds: 0, elapsedSeconds: 0, releasedSeconds: 0, remainingSeconds: null, overrunSeconds: 0 }, projects: [], agentClasses: [], workdayTime: [] })),
		api.request('GET', `${base}/atlas${suffix}`).catch(()=>fallbackAtlas(team.id,overview)),
	]);
	return {
		overview,
		atlas:atlas as AgentAtlasProjection,
		activity: activity as AgentLabDelta<AgentLabActivityInterval>,
		series: series as AgentLabDelta<AgentLabMetricPoint>,
		allocation,
		endpoints: { overview: `${base}/overview${suffix}`, activity: `${base}/activity${suffix}`, metricSeries: `${base}/metric-series${suffix}`, allocation: `${base}/allocation${suffix}` },
		atlasEndpoints:{projection:`${base}/atlas${suffix}`,delta:`${base}/atlas/delta${suffix}`,stream:`${base}/atlas/events/stream${suffix}`,detail:`${base}/atlas/details`,assignmentGraphs:`${base}/atlas/assignment-graphs`,viewState:`${base}/view-state`,createAgent:`/app/work/build?create=agent`,createGroup:`/app/work/build?create=group`},
		targetEndpoint: `${base}/targets`,
		preference: { enabled: preferences.realTimeUpdates, intervalSeconds: preferences.realTimePollingIntervalSeconds },
	};
}

import { agentLabMetricKeys, type AgentAtlasProjection, type AgentLabActivityInterval, type AgentLabDelta, type AgentLabMetricPoint, type AgentLabOverview } from '@treeseed/sdk/agent-capacity';
import type { AccountPreferences } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../lib/market/api-client.ts';
import type { AllocationSnapshot } from '@treeseed/ui/components/react/OperationsMonitor';
import { items } from '../../lib/operations/records.ts';

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

function fallbackAtlas(teamId:string,overview:AgentLabOverview):AgentAtlasProjection{return{revision:'server-snapshot-unavailable',generatedAt:overview.generatedAt,timeZone:overview.timeZone,scope:{teamId,selectedDate:overview.workdayContext.selectedDate,workdayIds:[],projectIds:[],groupIds:[],agentIds:[],activityProfiles:[],sizingMetric:'activity'},topologies:[],nodeStates:[],assignments:[],activity:[],workdaySummary:null,activityWindow:{total:0,loaded:0,truncated:false},playback:{mode:'live',startedAt:overview.operatingDay.start,endedAt:overview.operatingDay.end,liveEdgeAt:overview.generatedAt,cursor:{cursor:null,observedAt:overview.generatedAt,positions:{}}},alerts:[{id:'atlas-unavailable',severity:'warning',message:'The Agent Atlas projection is temporarily unavailable.'}]}}

export async function loadAgentLabFrame(api: ApiClientFacade, team: { id: string; name?: string; slug?: string }, preferences: AccountPreferences, selection: { date?: string | null; workday?: string | null } = {}) {
	void selection;
	const [providerResult, workdayResult, assignmentResult, projectResult] = await Promise.all([
		api.listProviderAvailabilitySessions(team.id).catch(() => null),
		api.listWorkdayRuns(team.id).catch(() => null),
		api.listProviderAssignments(team.id).catch(() => null),
		api.listProjectsForPrincipal().catch(() => null),
	]);
	const providers = providerResult === null ? null : items(providerResult);
	const workdays = workdayResult === null ? null : items(workdayResult);
	const assignments = assignmentResult === null ? null : items(assignmentResult);
	const projects = projectResult === null ? null : items(projectResult).filter((item) => item.teamId === team.id);
	const overview = fallbackOverview(team, preferences.timeZone);
	overview.connectivity = [providers, workdays, assignments, projects].every((value) => value !== null) ? 'live' : 'degraded';
	if (providers) overview.activeProviders = providers.filter((item: any) => ['active', 'available', 'connected'].includes(String(item.status))).length;
	if (workdays) {
		overview.activeWorkdays = workdays.filter((item: any) => ['running', 'active'].includes(String(item.status))).length;
		overview.workdayContext.workdays = workdays as any;
	}
	overview.metrics = overview.metrics.map((metric) => {
		const value = metric.key === 'workdays' && workdays ? workdays.length
			: metric.key === 'assignments' && assignments ? assignments.length
				: metric.key === 'agents' && projects ? projects.length : null;
		return value === null ? { ...metric, value: null as any, secondary: 'Unavailable' } : { ...metric, value, secondary: 'Catalog read' };
	});
	const activity = { revision: 'catalog-foundation', generatedAt: new Date().toISOString(), cursor: null, upserts: [], removedIds: [] };
	const series = { revision: 'catalog-foundation', generatedAt: new Date().toISOString(), cursor: null, upserts: [], removedIds: [] };
	const allocation = { revision: 'catalog-foundation', generatedAt: new Date().toISOString(), canManage: false, activeAllocationSetId: null,
		time: { availableSeconds: null, requestedSeconds: 0, reservedSeconds: 0, activeSeconds: 0, elapsedSeconds: 0, releasedSeconds: 0, remainingSeconds: null, overrunSeconds: 0 }, projects: [], agentClasses: [], workdayTime: [] };
	const atlas = fallbackAtlas(team.id, overview);
	return {
		overview,
		atlas:atlas as AgentAtlasProjection,
		activity: activity as AgentLabDelta<AgentLabActivityInterval>,
		series: series as AgentLabDelta<AgentLabMetricPoint>,
		allocation: allocation as AllocationSnapshot,
		endpoints: { overview: '', activity: '', metricSeries: '', allocation: '', viewState: '' },
		atlasEndpoints:{projection:'',delta:'',stream:'',detail:'',assignmentGraphs:'',viewState:'',createAgent:`/app/work/build?create=agent`,createGroup:`/app/work/build?create=group`,createProject:'/app/projects',connectService:'/app/services/new',configureCapacity:'/app/capacity'},
		targetEndpoint: '',
		preference: { enabled: preferences.realTimeUpdates, intervalSeconds: preferences.realTimePollingIntervalSeconds },
	};
}

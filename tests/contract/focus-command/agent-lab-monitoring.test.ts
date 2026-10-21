import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import { loadAgentLabFrame } from '../../../src/view-models/agent-lab/agent-lab-frame';

const source = (path: string) => readFileSync(path, 'utf8');
const entityRoutes = ['agents', 'events', 'assignments', 'executions', 'artifacts'];
const navigatorRoutes = ['inbox', 'decisions', 'build', 'direction', 'results', 'find'];

describe('Agent Lab command header and navigator', () => {
	it('normalizes catalog collection envelopes before deriving monitoring totals', async () => {
		const api = {
			listProviderAvailabilitySessions: async () => ({ items: [{ status: 'active' }] }),
			listWorkdayRuns: async () => ({ items: [{ id: 'workday-1', status: 'running' }] }),
				listProviderAssignments: async () => ({ items: [{ id: 'assignment-1',stateVersion:1,teamId:'team-1',projectId:'project-1',agentId:'project-1/engineer',status:'completed',assignedAt:'2026-10-18T01:20:00.000Z',completedAt:'2026-10-18T01:21:00.000Z' }],page:{hasMore:false,nextCursor:null} }),
			listProjectsForPrincipal: async () => ({ items: [{ id: 'project-1', teamId: 'team-1', name:'Project One' }] }),
				invoke: async (operation: unknown, input: {path: {projectId: string}}) => {
					expect(operation).toBe(CONTROL_PLANE_OPERATIONS.agents.list);
					expect(input.path).toEqual({projectId:'project-1'});
					return {projectId:'project-1',agents:[{agentSlug:'engineer',definition:{id:'project-1/engineer',name:'Engineer'}},{agentSlug:'reviewer',definition:{id:'project-1/reviewer',name:'Reviewer'}}]};
				},
		};
		const frame = await loadAgentLabFrame(api as any, { id: 'team-1', name: 'TreeSeed' }, {
			timeZone: 'UTC', realTimeUpdates: true, realTimePollingIntervalSeconds: 5,
		} as any);
		expect(frame.overview.connectivity).toBe('live');
		expect(frame.overview.activeProviders).toBe(1);
		expect(frame.overview.activeWorkdays).toBe(1);
		expect(frame.overview.workdayContext.workdays).toHaveLength(1);
		expect(Object.fromEntries(frame.overview.metrics.map((metric) => [metric.key, metric.value]))).toMatchObject({ workdays: 1, assignments: 1, agents: 2 });
	});
	it('provides a scoped overview endpoint for realtime header reads', async () => {
		const api = {
			listProviderAvailabilitySessions: async () => ({items:[]}),
			listWorkdayRuns: async () => ({items:[]}),
			listProviderAssignments: async () => ({items:[],page:{hasMore:false,nextCursor:null}}),
			listProjectsForPrincipal: async () => ({items:[]}),
		};
		const frame=await loadAgentLabFrame(api as any,{id:'team-1'}, {
			timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5,
		} as any,{date:'2026-10-18',workday:'workday-7'});
		expect(frame.endpoints.overview).toBe('/app/work/overview?date=2026-10-18&workday=workday-7');
	});
	it('uses one shared chrome without conventional page or Command navigation', () => {
		for (const removed of ['AgentLabChrome.astro', 'AgentLabMonitor.astro', 'AgentLabEntityPage.astro', 'AgentLabCommandPage.astro']) expect(() => source(`src/components/agent-lab/${removed}`)).toThrow();
		expect(source('src/pages/app/work/index.astro')).toContain('AgentLabHomeSurface');
		expect(source('src/pages/app/work/[runId].astro')).toContain('WorkdayDetailSurface');
		const routes = source('src/routes.ts');
		for (const route of entityRoutes) {
			const entityPage = source(`src/pages/app/work/${route}/index.astro`);
			expect(routes).toContain(`adminRoute('/app/work/${route}', 'pages/app/work/${route}/index.astro'`);
			expect(entityPage).toContain('AgentLabEntitySurface');
			expect(entityPage).not.toMatch(/<PageHeader\b|<ModeNavigation\b/u);
		}
		expect(source('src/pages/app/work/workdays/index.astro')).toContain('WorkdayCollectionSurface');
	});

	it('registers production-backed command routes with one reusable workspace', () => {
		const routes = source('src/routes.ts');
		for (const route of navigatorRoutes) {
			expect(routes).toContain(`/app/work/${route}`);
			expect(source(`src/pages/app/work/${route}/index.astro`)).toContain('AgentLabCommandSurface');
		}
	});

	it('preserves workday scope and keeps realtime ownership in UI', () => {
		const workdays = source('src/pages/app/work/workdays/index.astro');
		expect(workdays).toContain('WorkdayCollectionSurface');
		const atlas = source('src/pages/app/work/index.astro');
		expect(atlas).toContain("searchParams.get('focus') === 'atlas'");
		expect(atlas).toContain("includes('workday:diagnose')");
		expect(atlas).toContain('{canDiagnose}');
	});

	it('proves immutable historical definition evidence across responsive Atlas scenes', () => {
		const scene = source('guarantees/work/scenes/agent-lab-workspace-focus.scene.yaml');
		for (const profile of ['desktop_chromium', 'tablet_chromium', 'mobile_chromium']) expect(scene).toContain(`id: ${profile}`);
		expect(scene).toContain('id: inspect-historical-agent');
		expect(scene).toContain('agent-lab.definition-provenance');
		expect(scene).toContain('text: Historical definition');
	});
});

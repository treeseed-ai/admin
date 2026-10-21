import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import { describe, expect, it } from 'vitest';
import type { ApiClientFacade } from '../../src/lib/market/api-client.ts';
import type {CapacityWorkdayEventRecord} from '@treeseed/sdk/agent-capacity';
import type { AccountPreferences } from '@treeseed/sdk/account-contracts';
import { loadAgentLabFrame } from '../../src/view-models/agent-lab/agent-lab-frame.ts';
import { atlasDate, localDate, localDayBounds, projectAtlasActivity, readAtlasAssignments } from '../../src/view-models/agent-lab/atlas-snapshot.ts';

const preferences = { timeZone: 'America/New_York', realTimeUpdates: true, realTimePollingIntervalSeconds: 5 } as AccountPreferences;
const assignment = {
  id: 'assignment-real', stateVersion: 7, teamId: 'team', projectId: 'admin', agentId: 'admin/researcher', workDayId: 'conversation-real', status: 'completed',
  assignedAt: '2026-10-18T01:19:45.000Z', claimedAt: '2026-10-18T01:19:49.000Z', completedAt: '2026-10-18T01:20:29.000Z', updatedAt: '2026-10-18T01:20:29.000Z',
  graphRevision: 3, executionNodeId: 'communication-real', leaseToken: 'PRIVATE-LEASE-NOT-FOR-THE-BROWSER',
  workspaceContext: { assignmentAttempt: { agentClass: 'researcher-class', effectiveProfile: { activity: 'chat', profileRef: { id: 'admin/researcher', commit: 'a'.repeat(40), path: 'agents/researcher.mdx' } } } },
  capacityEnvelope: { budget: { time: { executionStartedAt: '2026-10-18T01:19:55.000Z' } } },
  assignmentResult: { id: 'result-real', summary: 'Exact source-backed research.', references: [{ kind: 'treedx', projectId: 'admin', repository: 'library', commit: 'b'.repeat(40), path: 'discussion-messages/topic/response.mdx' }] },
};
function client(rows: unknown[], page = { hasMore: false, nextCursor: null as string | null }) {
  return {
    listProviderAvailabilitySessions: async () => ({ items: [] }), listWorkdayRuns: async () => ({ items: [] }),
    listProviderAssignments: async () => ({ items: rows, page }), listProjectsForPrincipal: async () => ({ items: [{ id: 'admin', teamId: 'team', name: 'Admin' }] }),
    invoke: async (binding: { descriptor: {operationId: string} }, input: { path?: Record<string, string>; query?: Record<string, unknown> }) => {
      if (binding.descriptor.operationId === 'agents.list') return { projectId: input.path?.projectId, agents: [{ agentSlug: 'admin/researcher', displayName: 'Researcher' }] };
      return { items: [], page: { hasMore: false, nextCursor: null } };
    },
  } as unknown as ApiClientFacade;
}
// The installed SDK also declares a retired alias; fixture only the observed canonical public fields.
type HistoryEvent=Pick<CapacityWorkdayEventRecord,'id'|'teamId'|'runId'|'workdayId'|'projectId'|'assignmentId'|'eventIndex'|'eventType'|'status'|'title'|'message'|'parameters'|'context'|'refs'|'metadata'|'createdAt'>;
const event = (id: string, index: number, overrides: Partial<HistoryEvent> = {}):HistoryEvent => ({
  id, teamId: 'team', runId: 'conversation-real', workdayId: null, projectId:'admin', assignmentId:null, eventIndex:index, status:'recorded', message:null, parameters:{}, context:{}, refs:{}, metadata:{}, eventType: `event-${index}`,
  title: `Title ${index}`, createdAt: `2026-10-17T12:00:0${index}.000Z`, ...overrides,
});
function historyClient(events: unknown[][]) {
  const calls: Array<{ path: unknown; query: unknown }> = [];
  const api = client([assignment]);
  Object.assign(api, {invoke: async (binding: { descriptor: {operationId: string} }, input: { path?: unknown; query?: unknown }) => {
    if (binding.descriptor.operationId === 'agents.list') return { projectId: 'admin', agents: [{ agentSlug: 'admin/researcher', displayName: 'Researcher' }] };
    expect(binding.descriptor.operationId).toBe('workdays.events.list');
    calls.push({ path: input.path, query: input.query });
    const page = events[calls.length - 1] ?? [];
    return { items: page, page: calls.length === 1 ? { hasMore: true, nextCursor: 'next' } : { hasMore: false, nextCursor: null } };
  }});
  return { api, calls };
}
async function frameWithEvents(events: unknown[][]) {
  const { api } = historyClient(events);
  return loadAgentLabFrame(api, { id: 'team' }, preferences, { date: '2026-10-17', workday: 'conversation-real' });
}
describe('Atlas reads the actual scoped assignment', () => {
  it('shows a real conversation assignment on the selected local day and workday without exposing lease authority', async () => {
    const frame = await loadAgentLabFrame(client([assignment]), { id: 'team' }, preferences, { date: '2026-10-17', workday: 'conversation-real' });
    expect(frame.atlas.scope).toMatchObject({ selectedDate: '2026-10-17', workdayIds: ['conversation-real'] });
    expect(frame.atlasEndpoints.activity).toBe('/app/work/atlas/activity?date=2026-10-17&workday=conversation-real');
    expect(frame.endpoints.activity).toBe('/app/work/atlas/activity?date=2026-10-17&workday=conversation-real');
    expect(frame.activity).toMatchObject({complete:true,cursor:null,upserts:[expect.objectContaining({id:assignment.id,projectName:'Admin',agentName:'Researcher',assignmentId:assignment.id,startedAt:assignment.assignedAt,finishedAt:assignment.completedAt})]});
    expect(frame.atlas.assignments).toEqual([expect.objectContaining({ id: assignment.id, agentId: assignment.agentId, status: 'completed', progressPercent: null })]);
    expect(frame.atlas.topologies[0]).toMatchObject({ immutableRef: 'a'.repeat(40), projectId: 'admin' });
    expect(JSON.stringify(frame)).not.toContain(assignment.leaseToken);
  });
  it('keeps a different local day empty rather than leaking the current assignment into it', async () => {
    const frame = await loadAgentLabFrame(client([assignment]), { id: 'team' }, preferences, { date: '2026-10-16' });
    expect(frame.atlas.scope.selectedDate).toBe('2026-10-16'); expect(frame.atlas.assignments).toEqual([]);
    expect(frame.activity.upserts).toEqual([]); expect(frame.activity.removedIds).toContain(assignment.id);
  });
  it('denies a foreign-team row even when the upstream response otherwise appears complete', async () => {
    const frame = await loadAgentLabFrame(client([{ ...assignment, teamId: 'foreign' }]), { id: 'team' }, preferences, { date: '2026-10-17' });
    expect(frame.atlas.assignments).toEqual([]); expect(frame.atlas.alerts.some(a => a.id.includes('unavailable'))).toBe(true);
    expect(frame.activity.revision).toBe('activity-unavailable');
  });
  it('keeps an incomplete assignment inventory unavailable', async () => {
    const frame = await loadAgentLabFrame(client([assignment], { hasMore: true, nextCursor: null }), { id: 'team' }, preferences, { date: '2026-10-17' });
    expect(frame.atlas.assignments).toEqual([]); expect(frame.atlas.alerts.some(a => a.id.includes('unavailable'))).toBe(true);
  });
  it('retains each page exactly once and rejects repeated cursors and duplicate rows', async () => {
    const cursors: Array<string | undefined> = [];
    const api = { listProviderAssignments: async (_team: string, filters: { cursor?: string }) => { cursors.push(filters.cursor); return filters.cursor ? { items: [{ ...assignment, id: 'second' }], page: { hasMore: false, nextCursor: null } } : { items: [assignment], page: { hasMore: true, nextCursor: 'next' } }; } } as unknown as ApiClientFacade;
    expect((await readAtlasAssignments(api, 'team')).map(a => a.id)).toEqual(['assignment-real', 'second']); expect(cursors).toEqual([undefined, 'next']);
    await expect(readAtlasAssignments(client([assignment], { hasMore: true, nextCursor: 'same' }), 'team')).rejects.toThrow();
  });
  it('uses actual local calendar dates across daylight-saving boundaries', () => {
    expect(localDate('2026-03-08T04:30:00.000Z', 'America/New_York')).toBe('2026-03-07');
    expect(localDate('2026-11-01T05:30:00.000Z', 'America/New_York')).toBe('2026-11-01');
    expect(() => atlasDate('2026-02-31', 'America/New_York')).toThrow();
  });
  it('projects complete stable assignment upserts for overlapping local operating days',()=>{
    const dayBounds=localDayBounds('2026-11-01','America/New_York');
    expect(dayBounds).toEqual({start:'2026-11-01T04:00:00.000Z',end:'2026-11-02T05:00:00.000Z'});
    const spanning={...assignment,assignedAt:'2026-11-01T03:59:00.000Z',claimedAt:'2026-11-01T04:10:00.000Z',completedAt:'2026-11-01T05:00:00.000Z',status:'failed',failedAt:'2026-11-01T05:00:00.000Z'};
    const first=projectAtlasActivity([spanning], 'team','America/New_York','2026-11-01','conversation-real');
    const repeated=projectAtlasActivity([spanning], 'team','America/New_York','2026-11-01','conversation-real');
    expect(first).toMatchObject({complete:true,dayBounds,upserts:[{id:assignment.id,stateVersion:7,status:'failed',activity:'chat',profileId:'admin/researcher',
      agentId:assignment.agentId,agentClass:'researcher-class',assignedAt:spanning.assignedAt,claimedAt:spanning.claimedAt,
      executionStartedAt:'2026-10-18T01:19:55.000Z',finishedAt:spanning.failedAt}],removedIds:[]});
    expect(repeated.upserts.map(item=>item.id)).toEqual(first.upserts.map(item=>item.id));
    expect(projectAtlasActivity([], 'team','America/New_York','2026-11-01').upserts).toEqual([]);
    expect(projectAtlasActivity([{...spanning,assignedAt:dayBounds.end,status:'running',completedAt:undefined,failedAt:undefined}], 'team','America/New_York','2026-11-01').upserts).toEqual([]);
    expect(projectAtlasActivity([{...spanning,assignedAt:'2026-11-01T03:00:00.000Z',status:'completed',completedAt:dayBounds.start,failedAt:undefined}], 'team','America/New_York','2026-11-01').upserts).toEqual([]);
  });
  it('retains an open cross-midnight assignment with a null finish and exact workday selection',()=>{
    const open={...assignment,assignedAt:'2026-10-17T23:30:00.000Z',claimedAt:undefined,completedAt:undefined,failedAt:undefined,returnedAt:undefined,status:'running'};
    const result=projectAtlasActivity([open], 'team','UTC','2026-10-18','conversation-real');
    expect(result.upserts).toEqual([expect.objectContaining({id:assignment.id,finishedAt:null,status:'running',executionStartedAt:'2026-10-18T01:19:55.000Z'})]);
    expect(projectAtlasActivity([open], 'team','UTC','2026-10-18','other').upserts).toEqual([]);
  });
  it('loads complete selected-run history, orders by index, and uses eventType when title is null', async () => {
    const first = event('event-one', 1, { title: null });
    const second = event('event-zero', 0);
    const { api, calls } = historyClient([[first], [second]]);
    const frame = await loadAgentLabFrame(api, { id: 'team' }, preferences, { date: '2026-10-17', workday: 'conversation-real' });
    expect(calls).toHaveLength(2);
    expect(calls.map(c => c.path)).toEqual([{ teamId: 'team', runId: 'conversation-real' }, { teamId: 'team', runId: 'conversation-real' }]);
    expect(calls[1].query).toMatchObject({ cursor: 'next' });
    expect(frame.atlas.scope).toMatchObject({ selectedDate: '2026-10-17', workdayIds: ['conversation-real'] });
    expect(frame.atlas.activity).toEqual([
      expect.objectContaining({ id: 'event-zero', timestamp: '2026-10-17T12:00:00.000Z', sequence:0 }),
      expect.objectContaining({ id: 'event-one', summary: 'event-1', timestamp: '2026-10-17T12:00:01.000Z',sequence:1 }),
    ]);
    expect(JSON.stringify(frame)).not.toContain(assignment.leaseToken);
  });
  it('changes projection revision when only selected-run event history changes', async () => {
    const before = await frameWithEvents([[event('event-zero', 0)]]);
    const after = await frameWithEvents([[event('event-zero', 0, { title: 'Updated title' })]]);
    expect(after.atlas.revision).not.toBe(before.atlas.revision);
  });
  it('keeps gapped terminal event history visibly unavailable', async () => {
    const frame = await frameWithEvents([[event('event-zero', 0), event('event-two', 2)]]);
    expect(frame.atlas.activity).toEqual([]);
    expect(frame.atlas.alerts.some(a => a.id.includes('history-unavailable'))).toBe(true);
  });
});

describe('selected history denies incomplete or foreign public observations',()=>{
 it.each([
  ['foreign team',{teamId:'foreign'}],['foreign run',{runId:'foreign'}],['foreign workday',{workdayId:'foreign'}],
  ['negative index',{eventIndex:-1}],['fractional index',{eventIndex:0.5}],['invalid clock',{createdAt:'not-a-clock'}],
  ['rolled-over clock',{createdAt:'2026-02-30T12:00:00.000Z'}],['empty event identity',{id:''}],['empty event type',{eventType:''}],
 ] as const)('retains assignment data while %s is visibly unavailable',async(_label,overrides)=>{
  const frame=await frameWithEvents([[event('event-zero',0,overrides)]]);
  expect(frame.atlas.assignments).toHaveLength(1);expect(frame.atlas.activity).toEqual([]);
  expect(frame.atlas.activityWindow.truncated).toBe(true);expect(frame.atlas.alerts.some(a=>a.id==='history-unavailable')).toBe(true);
 });
 it('denies duplicate source identities even across different contiguous indices',async()=>{
  const frame=await frameWithEvents([[event('duplicate',0)],[event('duplicate',1)]]);
  expect(frame.atlas.activity).toEqual([]);expect(frame.atlas.activityWindow.truncated).toBe(true);
 });
 it('retains complete empty selected history without claiming portfolio history',async()=>{
  const scoped=await frameWithEvents([[]]);expect(scoped.atlas.activityWindow).toEqual({total:0,loaded:0,truncated:false});
  const portfolio=await loadAgentLabFrame(client([assignment]),{id:'team'},preferences,{date:'2026-10-17'});
  expect(portfolio.atlas.activityWindow.truncated).toBe(true);
 });
});

import {describe,expect,it} from 'vitest';
import type {ApiClientFacade} from '../../src/lib/market/api-client.ts';
import type {AccountPreferences} from '@treeseed/sdk/account-contracts';
import {loadAgentLabFrame} from '../../src/view-models/agent-lab/agent-lab-frame.ts';

const preferences={timeZone:'America/New_York',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences;
const assignment={id:'assignment-real',teamId:'team',projectId:'admin',agentId:'admin/researcher',workDayId:'conversation-real',status:'completed',
 assignedAt:'2026-10-18T01:19:45.000Z',claimedAt:'2026-10-18T01:19:49.000Z',completedAt:'2026-10-18T01:20:29.000Z',updatedAt:'2026-10-18T01:20:29.000Z',
 graphRevision:3,executionNodeId:'communication-real',leaseToken:'PRIVATE-LEASE-NOT-FOR-THE-BROWSER',
 workspaceContext:{assignmentAttempt:{effectiveProfile:{activity:'chat',profileRef:{id:'admin/researcher',commit:'a'.repeat(40),path:'agents/researcher.mdx'}}}},
 assignmentResult:{id:'result-real',summary:'Exact source-backed research.',references:[{kind:'treedx',projectId:'admin',repository:'library',commit:'b'.repeat(40),path:'discussion-messages/topic/response.mdx'}]}};
function client(rows:unknown[],page={hasMore:false,nextCursor:null as string|null}){
 return {listProviderAvailabilitySessions:async()=>({items:[]}),listWorkdayRuns:async()=>({items:[]}),
  listProviderAssignments:async()=>({items:rows,page}),listProjectsForPrincipal:async()=>({items:[{id:'admin',teamId:'team',name:'Admin'}]})} as unknown as ApiClientFacade;
}
describe('Atlas reads the actual scoped assignment',()=>{
 it('shows a real conversation assignment on the selected local day and workday without exposing lease authority',async()=>{
  const frame=await loadAgentLabFrame(client([assignment]),{id:'team'},preferences,{date:'2026-10-17',workday:'conversation-real'});
  expect(frame.atlas.scope).toMatchObject({selectedDate:'2026-10-17',workdayIds:['conversation-real']});
  expect(frame.atlas.assignments).toEqual([expect.objectContaining({id:assignment.id,agentId:assignment.agentId,status:'completed',progressPercent:null})]);
  expect(frame.atlas.topologies[0]).toMatchObject({immutableRef:'a'.repeat(40),projectId:'admin'});
  expect(JSON.stringify(frame)).not.toContain(assignment.leaseToken);
 });
 it('keeps a different local day empty rather than leaking the current assignment into it',async()=>{
  const frame=await loadAgentLabFrame(client([assignment]),{id:'team'},preferences,{date:'2026-10-16'});
  expect(frame.atlas.scope.selectedDate).toBe('2026-10-16');expect(frame.atlas.assignments).toEqual([]);
 });
 it('denies a foreign-team row even when the upstream response otherwise appears complete',async()=>{
  const frame=await loadAgentLabFrame(client([{...assignment,teamId:'foreign'}]),{id:'team'},preferences,{date:'2026-10-17'});
  expect(frame.atlas.assignments).toEqual([]);expect(frame.atlas.alerts.some(a=>a.id.includes('unavailable'))).toBe(true);
 });
 it('keeps an incomplete assignment inventory unavailable',async()=>{
  const frame=await loadAgentLabFrame(client([assignment],{hasMore:true,nextCursor:null}),{id:'team'},preferences,{date:'2026-10-17'});
  expect(frame.atlas.assignments).toEqual([]);expect(frame.atlas.alerts.some(a=>a.id.includes('unavailable'))).toBe(true);
 });
});

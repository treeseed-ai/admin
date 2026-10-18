import {describe,expect,it} from 'vitest';
import type {ApiClientFacade} from '../../src/lib/market/api-client.ts';
import {atlasDetail} from '../../src/view-models/agent-lab/atlas-detail.ts';

const commit='b'.repeat(40),path='discussion-messages/topic/result.mdx';
const reference={kind:'treedx',projectId:'project',repository:'library',commit,path};
const assignment={id:'assignment',teamId:'team',projectId:'project',agentId:'project/researcher',status:'completed',updatedAt:'2026-10-17T01:20:00.000Z',leaseToken:'PRIVATE-LEASE',
 workspaceContext:{assignmentAttempt:{sourceRef:reference}},lifecycleOutput:{teardown:{verified:true}},leaseState:'released',
 assignmentResult:{summary:'Real result.',references:[reference],usage:{elapsedSeconds:25,native:{private:'PRIVATE-NATIVE'}}}};
function client(value=assignment,file={path,content:'---\nid: result\n---\nActual finding.',body:'Actual finding.'},ref=commit){
 const calls:Array<{method:string;path:string;body?:unknown}>=[];
 const api={request:async(method:string,url:string,options?:{body?:unknown})=>{
  calls.push({method,path:url,body:options?.body});
  return url.includes('/capacity/assignments/')?value:url.endsWith('/treedx-library')?{repositoryId:'library'}:{result:{ok:true,ref,files:[file]}};
 }} as unknown as ApiClientFacade;
 return {api,calls};
}
describe('Atlas follows only the assignment-owned committed result',()=>{
 it('resolves the exact original TreeDX commit and path without accepting caller paths',async()=>{
  const {api,calls}=client();const detail=await atlasDetail(api,'team','artifact','assignment:0');
  expect(detail).toMatchObject({description:'Actual finding.',summary:{assignment:'assignment',commit,path}});
  expect(calls[2]).toMatchObject({method:'POST',path:'/v1/dx/projects/project/repos/library/files/read',body:{ref:commit,paths:[path]}});
 });
 it('exposes the actual task and result relationship while omitting private authority and arbitrary native metadata',async()=>{
  const {api}=client();const detail=await atlasDetail(api,'team','assignment','assignment');
  expect(detail).toMatchObject({status:'completed',description:'Actual finding.',related:[{kind:'artifact',id:'assignment:0',title:path}]});
  expect(JSON.stringify(detail)).not.toMatch(/PRIVATE-LEASE|PRIVATE-NATIVE/);
 });
 it('denies a substituted team before any content read',async()=>{
  const {api,calls}=client({...assignment,teamId:'foreign'});await expect(atlasDetail(api,'team','artifact','assignment:0')).rejects.toMatchObject({status:404});expect(calls).toHaveLength(1);
 });
 it.each(['staging','refs/heads/staging'])('denies a moving result ref %s',async moving=>{
  const {api}=client({...assignment,assignmentResult:{...assignment.assignmentResult,references:[{...reference,commit:moving}]}});
  await expect(atlasDetail(api,'team','artifact','assignment:0')).rejects.toMatchObject({status:503});
 });
 it('rejects substituted content even when the requested commit exists',async()=>{
  const {api}=client(assignment,{path:'different.mdx',content:'different',body:'different'});
  await expect(atlasDetail(api,'team','artifact','assignment:0')).rejects.toMatchObject({status:503});
 });
 it('rejects stale detail rather than presenting new data as an old observation',async()=>{
  await expect(atlasDetail(client().api,'team','assignment','assignment','2026-10-17T01:19:00.000Z')).rejects.toMatchObject({status:409});
 });
 it.each(['assignment:-1','assignment:0:bad','assignment:99','assignment:/tmp/file'])('rejects unavailable result locator %s',async id=>{
  await expect(atlasDetail(client().api,'team','artifact',id)).rejects.toBeInstanceOf(Error);
 });
});

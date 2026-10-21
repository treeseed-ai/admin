import {afterAll,afterEach,beforeAll,describe,expect,it} from 'vitest';
import {createServer,type Server} from 'node:https';
import {getCACertificates,setDefaultCACertificates} from 'node:tls';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import type {AddressInfo} from 'node:net';
import type {AccountPreferences} from '@treeseed/sdk/account-contracts';
import {ApiClientFacade,type AstroLike} from '../../src/lib/market/api-client.ts';
import {setRequestCredential} from '../../src/lib/auth/application-session.ts';
import {loadAgentLabFrame} from '../../src/view-models/agent-lab/agent-lab-frame.ts';
import {atlasDetail} from '../../src/view-models/agent-lab/atlas-detail.ts';
import {GET as readDetail} from '../../src/pages/app/work/atlas/details/[kind]/[id].ts';
import type {APIContext} from 'astro';
import {GET as readStream} from '../../src/pages/app/work/atlas/stream.ts';
import {GET as readActivity} from '../../src/pages/app/work/atlas/activity.ts';
import {CONTROL_PLANE_OPERATIONS,controlPlaneOperation} from '@treeseed/sdk/operator-contracts';
import {catalogOperationPath} from '../../src/lib/market/api-client.ts';

// Native TLS/HTTP consumer integration. The separate live-service read-back proves
// the actual PostgreSQL-backed assignment and TreeDX product; this server is a fixture.
const commit='b'.repeat(40),path='discussion-messages/topic/result.mdx';
const reference={kind:'treedx',projectId:'project',repository:'library',commit,path};
const capacityStatus=controlPlaneOperation('capacity.status');
if(!capacityStatus)throw new Error('Existing canonical capacity status operation required');
const assignment={id:'assignment',stateVersion:4,teamId:'team',projectId:'project',agentId:'project/researcher',workDayId:'workday',status:'completed',
 assignedAt:'2026-10-17T20:00:00.000Z',claimedAt:'2026-10-17T20:00:02.000Z',completedAt:'2026-10-17T20:01:00.000Z',updatedAt:'2026-10-17T20:01:00.000Z',leaseToken:'private-lease',
 workspaceContext:{assignmentAttempt:{sourceRef:reference,effectiveProfile:{activity:'chat',profileRef:{commit,path:'agents/researcher.mdx'}}}},
 assignmentResult:{summary:'Source-backed finding.',references:[reference],usage:{elapsedSeconds:25}}};
let activityAssignment:Record<string,unknown>=assignment;
let server:Server,origin:string,directory:string;
let activeToken='synthetic-test-token';
let providerUnavailable=false;
let agentCatalog:unknown={projectId:'project',agents:[{agentSlug:'project/researcher',displayName:'Researcher'},{agentSlug:'arbitrary-b',displayName:'Other'}]};
let agentsUnavailable=false;
const historyEvent=(eventIndex:number)=>({id:`event-${eventIndex}`,teamId:'team',runId:'workday',workdayId:null,projectId:'project',assignmentId:null,eventIndex,eventType:'assignment.observed',status:'recorded',title:null,message:null,createdAt:`2026-10-17T20:00:0${eventIndex}.000Z`,parameters:{},context:{},refs:{},metadata:{privateDiagnostic:'NEVER-FOR-BROWSER'}});
let historyRows:Record<string,unknown>[]=[];
let historyFailure:string|null=null;
let assignmentFailure:string|null=null,emptyAssignmentInventory=false;
afterEach(()=>{historyRows=[];historyFailure=null;assignmentFailure=null;emptyAssignmentInventory=false;activityAssignment=assignment;activeToken='synthetic-test-token';providerUnavailable=false;agentsUnavailable=false;agentCatalog={projectId:'project',agents:[{agentSlug:'project/researcher',displayName:'Researcher'},{agentSlug:'arbitrary-b',displayName:'Other'}]};});
const authorities=getCACertificates('default'),requests:Array<{method:string;path:string;body:string;authorization:string|undefined}>=[];
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'admin-atlas-tls-'));
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-keyout',join(directory,'key.pem'),'-out',join(directory,'cert.pem')],{stdio:'ignore'});
 setDefaultCACertificates([...authorities,readFileSync(join(directory,'cert.pem'),'utf8')]);
 server=createServer({key:readFileSync(join(directory,'key.pem')),cert:readFileSync(join(directory,'cert.pem'))},async(req,res)=>{
  const url=new URL(req.url!,origin);let body='';for await(const chunk of req)body+=chunk;
  requests.push({method:req.method!,path:url.pathname+url.search,body,authorization:req.headers.authorization});
  res.setHeader('content-type','application/json');
  if(req.headers.authorization!==`Bearer ${activeToken}`){res.statusCode=401;res.end(JSON.stringify({ok:false,message:'Not authenticated.'}));return;}
  if(url.pathname.endsWith('/capacity/availability-sessions')&&url.pathname!==catalogOperationPath(capacityStatus,{teamId:'team'},{})){
   res.statusCode=403;res.end(JSON.stringify({ok:false,message:'Team scope denied.'}));return;
  }
  if(url.pathname.endsWith('/capacity/provider-sessions')){res.statusCode=404;res.end(JSON.stringify({ok:false,message:'Retired provider route.'}));return;}
  if(url.pathname===catalogOperationPath(capacityStatus,{teamId:'team'},{})){
   if(providerUnavailable){res.statusCode=503;res.end(JSON.stringify({ok:false,message:'Provider observations unavailable.'}));return;}
   const items=[{id:'open-session',capacityProviderId:'provider',status:'open'},{id:'closed-session',capacityProviderId:'provider',status:'closed'}]
    .filter(value=>!url.searchParams.get('status')||value.status===url.searchParams.get('status'));
   res.end(JSON.stringify({ok:true,data:{items,page:{hasMore:false,nextCursor:null}}}));return;
  }
  if(url.pathname==='/v1/teams/team/workday-runs/workday/events'){
   if(historyFailure==='denied'){res.statusCode=403;res.end(JSON.stringify({ok:false,message:'History scope denied.'}));return;}
   const cursor=url.searchParams.get('cursor'),items=cursor?historyRows.slice(1):historyRows.slice(0,1);
   const page=cursor?{hasMore:false,nextCursor:null}:{hasMore:historyRows.length>1,nextCursor:historyRows.length>1?'next':null};
   if(historyFailure==='truncated'){page.hasMore=true;page.nextCursor=null;}
   if(historyFailure==='repeat'){page.hasMore=true;page.nextCursor='next';}
   res.end(JSON.stringify({ok:true,data:{items,page}}));return;
  }
  if(url.pathname==='/v1/projects/project/agents'){
   if(agentsUnavailable){res.statusCode=503;res.end(JSON.stringify({ok:false,message:'Agent catalog unavailable.'}));return;}
   res.end(JSON.stringify({ok:true,data:agentCatalog}));return;
  }
  if(url.pathname==='/v1/teams/team/capacity/assignments'){
   if(assignmentFailure==='error'){res.statusCode=503;res.end(JSON.stringify({ok:false,message:'Assignment inventory unavailable.'}));return;}
   res.end(JSON.stringify({ok:true,data:{items:emptyAssignmentInventory?[]:[activityAssignment],page:assignmentFailure==='truncated'?{hasMore:true,nextCursor:null}:{hasMore:false,nextCursor:null}}}));return;
  }
  const data=url.pathname==='/v1/teams'?[{id:'team',status:'active'}]:url.pathname==='/v1/projects'?{items:[{id:'project',teamId:'team',name:'Project'},{id:'foreign-project',teamId:'foreign'}]}:
   url.pathname==='/v1/teams/team/capacity/assignments'?{items:[assignment],page:{hasMore:false,nextCursor:null}}:
   url.pathname==='/v1/teams/team/capacity/assignments/assignment'?assignment:
   url.pathname==='/v1/projects/project/treedx-library'?{repositoryId:'library'}:
   url.pathname==='/v1/dx/projects/project/repos/library/files/read'?{result:{ok:true,ref:commit,files:[{path,content:'Exact native transport finding.',body:'Exact native transport finding.'}]}}:
   url.pathname===catalogOperationPath(CONTROL_PLANE_OPERATIONS.accounts.preferences,{},{} )?{timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5}:{items:[]};
  res.end(JSON.stringify({ok:true,data}));
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`https://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async()=>{server?.closeAllConnections();if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));setDefaultCACertificates(authorities);if(directory)rmSync(directory,{recursive:true});});
function client(authenticated=true,token='synthetic-test-token'){
 const context={locals:{auth:{principal:{id:'operator'}},runtime:{env:{TREESEED_API_BASE_URL:origin}}},request:new Request('https://admin.test/app/work'),url:new URL('https://admin.test/app/work'),cookies:{get:()=>({value:'team'})}} as unknown as AstroLike;
 if(authenticated)setRequestCredential(context,{resource:origin,accessToken:token});
 return new ApiClientFacade(context);
}
describe('Admin native public assignment-to-artifact transport',()=>{
 it('serves genuine assignment activity as stable complete upserts, including complete-empty and unavailable inventory',async()=>{
  agentCatalog={projectId:'project',agents:[{agentSlug:'project/researcher',displayName:'Researcher'}]};
  const api=client(),context=(date:string)=>({...api.context,url:new URL(`https://admin.test/app/work/atlas/activity?date=${date}&workday=workday`)}) as APIContext;
  const first=await readActivity(context('2026-10-17'));expect(first!.status).toBe(200);expect(first!.headers.get('cache-control')).toBe('private, no-store');
  const body=await first!.json();expect(body.payload).toMatchObject({complete:true,upserts:[{id:'assignment',stateVersion:4,
   projectId:'project',projectName:'Project',agentId:'project/researcher',agentName:'Researcher',activityProfile:'chat',assignmentId:'assignment',
   status:'completed',startedAt:assignment.assignedAt,finishedAt:assignment.completedAt}],removedIds:[]});
  const repeated=await readActivity(context('2026-10-17'));expect((await repeated!.json()).payload.upserts.map((item:{id:string})=>item.id)).toEqual(['assignment']);
  emptyAssignmentInventory=true;const emptyResponse=await readActivity(context('2026-10-17'));expect(emptyResponse!.status).toBe(200);
  expect((await emptyResponse!.json()).payload).toMatchObject({complete:true,upserts:[],removedIds:[]});
  emptyAssignmentInventory=false;
  for(const [status,finishField] of [['completed','completedAt'],['failed','failedAt'],['returned','returnedAt']] as const){
   activityAssignment={...assignment,status,completedAt:undefined,failedAt:undefined,returnedAt:undefined};
   const unknown=await readActivity(context('2026-10-17'));
   expect(unknown!.status).toBe(200);expect((await unknown!.json()).payload.upserts).toMatchObject([{id:'assignment',status,startedAt:assignment.assignedAt,activityProfile:'chat',finishedAt:null}]);
   activityAssignment={...activityAssignment,[finishField]:'2026-10-17T20:01:00.000Z'};
   const known=await readActivity(context('2026-10-17'));
   expect((await known!.json()).payload.upserts).toMatchObject([{status,finishedAt:'2026-10-17T20:01:00.000Z'}]);
   activityAssignment={...activityAssignment,[finishField]:'malformed'};
   expect((await readActivity(context('2026-10-17'))).status).toBe(503);
  }
  assignmentFailure='truncated';const unavailable=await readActivity(context('2026-10-17'));
  expect(unavailable!.status).toBe(503);expect((await unavailable!.json()).payload.message).toMatch(/unavailable|incomplete/i);
  const anonymous={...context('2026-10-17'),locals:{...api.context.locals,auth:null}} as unknown as APIContext;
  expect((await readActivity(anonymous))!.status).toBe(401);
 });
 it('reads complete selected history over authenticated native TLS with canonical scope and no private event payload',async()=>{
  historyRows=[historyEvent(1),historyEvent(0)];const start=requests.length;
  const frame=await loadAgentLabFrame(client(),{id:'team'},{timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences,{date:'2026-10-17',workday:'workday'});
  expect(frame.atlas.activity.map(({id,sequence,timestamp,summary})=>({id,sequence,timestamp,summary}))).toEqual([
   {id:'event-0',sequence:0,timestamp:'2026-10-17T20:00:00.000Z',summary:'assignment.observed'},
   {id:'event-1',sequence:1,timestamp:'2026-10-17T20:00:01.000Z',summary:'assignment.observed'},
  ]);
  expect(frame.atlas.activityWindow).toEqual({total:2,loaded:2,truncated:false});
  const reads=requests.slice(start).filter(r=>r.path.includes('/workday-runs/workday/events'));
  expect(reads).toHaveLength(2);expect(reads.every(r=>r.authorization==='Bearer synthetic-test-token')).toBe(true);
  expect(new URL(reads[1]!.path,origin).searchParams.get('cursor')).toBe('next');
  expect(JSON.stringify(frame)).not.toMatch(/NEVER-FOR-BROWSER|private-lease|synthetic-test-token/);
 });
 it.each(['gap','duplicate','foreign','truncated','repeat','denied'])('keeps native %s event observations unavailable without discarding healthy assignments',async mode=>{
  historyRows=[historyEvent(0),historyEvent(1)];
  if(mode==='gap')historyRows[1]!.eventIndex=2;
  if(mode==='duplicate')historyRows[1]!.id='event-0';
  if(mode==='foreign')historyRows[1]!.teamId='foreign';
  if(['truncated','repeat','denied'].includes(mode))historyFailure=mode;
  const frame=await loadAgentLabFrame(client(),{id:'team'},{timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences,{date:'2026-10-17',workday:'workday'});
  expect(frame.atlas.assignments).toHaveLength(1);expect(frame.atlas.activity).toEqual([]);
  expect(frame.atlas.activityWindow.truncated).toBe(true);expect(frame.atlas.alerts.some(a=>a.id==='history-unavailable')).toBe(true);
 });
 it('emits a live delta when only public event history changes and closes its scoped observer on abort',async()=>{
  historyRows=[historyEvent(0)];const api=client(),abort=new AbortController();
  const url=new URL('https://admin.test/app/work/atlas/stream?date=2026-10-17&workday=workday');
  try{
   const response=await readStream({...api.context,url,request:new Request(url,{signal:abort.signal})} as APIContext);
   expect(response!.status).toBe(200);const reader=response!.body!.getReader(),decode=new TextDecoder();
   const initial=decode.decode((await reader.read()).value);expect(initial).toContain('event: atlas.delta');
   historyRows=[historyEvent(0),historyEvent(1)];
   const update=decode.decode((await reader.read()).value);expect(update).toContain('event: atlas.delta');expect(update).not.toBe(initial);
   abort.abort();expect((await reader.read()).done).toBe(true);
  }finally{abort.abort();}
 });

 it('serves fresh scoped overview snapshots through the actual authenticated route without caching',async()=>{
  const modulePath='../../src/pages/app/work/overview.ts';const {GET}=await import(modulePath);
  const api=client(),context={...api.context,url:new URL('https://admin.test/app/work/overview?date=2026-10-17&workday=workday')} as APIContext;
  const first=await GET(context);expect(first.status).toBe(200);expect(first.headers.get('cache-control')).toBe('private, no-store');
  const one=await first.json();expect(one.payload.workdayContext.selectedDate).toBe('2026-10-17');expect(one.payload.workdayContext.selectedWorkdayId).toBe('workday');
  expect(one.payload.metrics.find((metric:{key:string})=>metric.key==='agents').value).toBe(2);
  agentCatalog={projectId:'project',agents:[{agentSlug:'project/researcher',displayName:'Researcher'},{agentSlug:'arbitrary-b',displayName:'Other'},{agentSlug:'arbitrary-c',displayName:'Third'}]};
  const second=await GET(context);expect(second.status).toBe(200);const two=await second.json();
  expect(two.payload.metrics.find((metric:{key:string})=>metric.key==='agents').value).toBe(3);
  expect(JSON.stringify(two)).not.toMatch(/private-lease|synthetic-test-token/);
 });
 it('denies anonymous and cross-team overview requests through native owning authorization',async()=>{
  const modulePath='../../src/pages/app/work/overview.ts';const {GET}=await import(modulePath);
  const api=client(),base={...api.context,url:new URL('https://admin.test/app/work/overview?date=2026-10-17')};
  const anonymous={...base,locals:{...api.context.locals,auth:null}} as unknown as APIContext;
  expect((await GET(anonymous)).status).toBe(401);
  const foreign={...base,cookies:{get:()=>({value:'foreign'})}} as unknown as APIContext;
  expect((await GET(foreign)).status).toBe(403);
 });
 it('rejects incomplete, malformed-date and unsupported historical overview reads instead of reporting success',async()=>{
  const modulePath='../../src/pages/app/work/overview.ts';const {GET}=await import(modulePath);
  const api=client(),context=(query:string)=>({...api.context,url:new URL('https://admin.test/app/work/overview?'+query)}) as APIContext;
  agentsUnavailable=true;expect((await GET(context('date=2026-10-17'))).status).toBe(503);agentsUnavailable=false;
  expect((await GET(context('date=2026-02-30'))).status).toBe(400);
  expect((await GET(context('date=2026-10-17&at=2026-10-17T20:00:00Z'))).status).toBe(503);
 });

 it('counts actual configured agents in the owning team catalog without reading foreign projects',async()=>{
  const frame=await loadAgentLabFrame(client(),{id:'team'},{timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences,{date:'2026-10-17',workday:'workday'});
  expect(frame.overview.metrics.find(metric=>metric.key==='agents')?.value).toBe(2);
  expect(requests.some(request=>request.path==='/v1/projects/project/agents'&&request.authorization==='Bearer synthetic-test-token')).toBe(true);
  expect(requests.some(request=>request.path.includes('/foreign-project/agents'))).toBe(false);
 });
 it.each([
  {projectId:'foreign-project',agents:[{agentSlug:'a'}]},
  {projectId:'project',agents:[{agentSlug:'a'},{agentSlug:'a'}]},
  {projectId:'project',agents:[{slug:'a'}]},
  {projectId:'project',agents:null},
 ])('keeps malformed configured-agent catalog %j unavailable instead of counting projects',async catalog=>{
  agentCatalog=catalog;
  const frame=await loadAgentLabFrame(client(),{id:'team'},{timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences);
  expect(frame.overview.metrics.find(metric=>metric.key==='agents')?.value).toBeNull();
  expect(frame.overview.connectivity).toBe('degraded');
 });
 it('retains failed agent catalog reads as unavailable while preserving observed provider inventory',async()=>{
  agentsUnavailable=true;
  const frame=await loadAgentLabFrame(client(),{id:'team'},{timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences);
  expect(frame.overview.metrics.find(metric=>metric.key==='agents')?.value).toBeNull();
  expect(frame.overview.activeProviders).toBe(1);expect(frame.overview.connectivity).toBe('degraded');
 });

 it('counts the real scoped provider inventory through the existing SDK capacity status operation instead of a retired route',async()=>{
  const api=client(),preferences={timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences;
  const frame=await loadAgentLabFrame(api,{id:'team'},preferences,{date:'2026-10-17',workday:'workday'});
  expect(frame.overview.activeProviders).toBe(1);expect(frame.overview.connectivity).toBe('live');
  await api.listProviderAvailabilitySessions('team',{providerId:'provider',status:'open'});
  const canonical=catalogOperationPath(capacityStatus,{teamId:'team'},{});
  expect(requests.some(request=>request.path.startsWith(canonical))).toBe(true);
  const filtered=requests.filter(request=>request.path.startsWith(canonical)).at(-1)!;
  const query=new URL(filtered.path,origin).searchParams;
  expect(query.get('providerId')).toBe('provider');expect(query.get('status')).toBe('open');
  expect(filtered.authorization).toBe('Bearer synthetic-test-token');
 });
 it('preserves the provider read authorization context and denies a foreign team through native TLS',async()=>{
  await expect(client(false).listProviderAvailabilitySessions('team')).rejects.toMatchObject({status:401});
  await expect(client().listProviderAvailabilitySessions('foreign')).rejects.toMatchObject({status:403});
  const foreign=catalogOperationPath(capacityStatus,{teamId:'foreign'},{});
  expect(requests.some(request=>request.path===foreign&&request.authorization==='Bearer synthetic-test-token')).toBe(true);
 });
 it('retains native canonical provider unavailability instead of a misleading successful empty inventory',async()=>{
  providerUnavailable=true;
  await expect(client().listProviderAvailabilitySessions('team')).rejects.toMatchObject({status:503});
 });
 it('closes a denied live TLS snapshot explicitly and reconnects only through a freshly authorized scoped request',async()=>{
  const scoped=(api:ApiClientFacade,abort:AbortController)=>({...api.context,url:new URL('https://admin.test/app/work/atlas/stream?date=2026-10-17&workday=workday'),
   request:new Request('https://admin.test/app/work/atlas/stream?date=2026-10-17&workday=workday',{signal:abort.signal})}) as APIContext;
  const firstAbort=new AbortController(),secondAbort=new AbortController();
  try{
   const first=await readStream(scoped(client(),firstAbort));expect(first!.status).toBe(200);
   const reader=first!.body!.getReader(),decode=new TextDecoder();expect(decode.decode((await reader.read()).value)).toContain('event: atlas.delta');
   activeToken='synthetic-refreshed-token';
   const unavailable=decode.decode((await reader.read()).value);expect(unavailable).toContain('event: atlas.unavailable');
   expect(unavailable).not.toContain('synthetic-');expect((await reader.read()).done).toBe(true);
   const denied=await readStream(scoped(client(),firstAbort));expect([401,403]).toContain(denied!.status);
   const second=await readStream(scoped(client(true,activeToken),secondAbort));expect(second!.status).toBe(200);
   const freshReader=second!.body!.getReader();expect(decode.decode((await freshReader.read()).value)).toContain('event: atlas.delta');
   secondAbort.abort();expect((await freshReader.read()).done).toBe(true);
  }finally{firstAbort.abort();secondAbort.abort();}
 });
 it('uses the real facade, scoped projection and immutable content readers over verified TLS',async()=>{
  const api=client(),preferences={timeZone:'UTC',realTimeUpdates:true,realTimePollingIntervalSeconds:5} as AccountPreferences;
  const frame=await loadAgentLabFrame(api,{id:'team'},preferences,{date:'2026-10-17',workday:'workday'});
  expect(frame.atlas.assignments.map(a=>a.id)).toEqual(['assignment']);
  const detail=await atlasDetail(api,'team','assignment','assignment');
  const artifact=await atlasDetail(api,'team','artifact',detail.related![0]!.id);
  expect(artifact.description).toBe('Exact native transport finding.');expect(artifact.summary).toMatchObject({commit,path});
  expect(requests.some(r=>r.path==='/v1/teams/team/capacity/assignments?limit=100')).toBe(true);
  expect(requests.filter(r=>r.method==='POST').map(r=>JSON.parse(r.body))).toEqual([{ref:commit,paths:[path],encoding:'utf8',parseFrontmatter:true},{ref:commit,paths:[path],encoding:'utf8',parseFrontmatter:true}]);
  expect(JSON.stringify({frame,detail,artifact})).not.toMatch(/private-lease|synthetic-test-token/);
 });
 it('propagates authentication denial instead of presenting an empty successful detail',async()=>{
  await expect(atlasDetail(client(false),'team','assignment','assignment')).rejects.toMatchObject({status:401});
 });
 it('follows the encoded browser result locator through the actual application route and native public reads',async()=>{
  const api=client();
  const response=await readDetail({...api.context,params:{kind:'artifact',id:'assignment%3A0'}} as unknown as APIContext);
  expect(response!.status).toBe(200);expect(await response!.json()).toMatchObject({payload:{status:'committed',summary:{commit,path}}});
 });
 it.each(['assignment%253A0','assignment%E0%A4%A'])('rejects malformed or double-encoded result locator %s',async id=>{
  const response=await readDetail({...client().context,params:{kind:'artifact',id}} as unknown as APIContext);
  expect(response!.status).toBe(400);
 });
});

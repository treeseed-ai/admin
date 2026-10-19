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
import {CONTROL_PLANE_OPERATIONS,controlPlaneOperation} from '@treeseed/sdk/operator-contracts';
import {catalogOperationPath} from '../../src/lib/market/api-client.ts';

// Native TLS/HTTP consumer integration. The separate live-service read-back proves
// the actual PostgreSQL-backed assignment and TreeDX product; this server is a fixture.
const commit='b'.repeat(40),path='discussion-messages/topic/result.mdx';
const reference={kind:'treedx',projectId:'project',repository:'library',commit,path};
const capacityStatus=controlPlaneOperation('capacity.status');
if(!capacityStatus)throw new Error('Existing canonical capacity status operation required');
const assignment={id:'assignment',teamId:'team',projectId:'project',agentId:'project/researcher',workDayId:'workday',status:'completed',
 assignedAt:'2026-10-17T20:00:00.000Z',updatedAt:'2026-10-17T20:01:00.000Z',leaseToken:'private-lease',
 workspaceContext:{assignmentAttempt:{sourceRef:reference,effectiveProfile:{activity:'chat',profileRef:{commit,path:'agents/researcher.mdx'}}}},
 assignmentResult:{summary:'Source-backed finding.',references:[reference],usage:{elapsedSeconds:25}}};
let server:Server,origin:string,directory:string;
let activeToken='synthetic-test-token';
let providerUnavailable=false;
afterEach(()=>{activeToken='synthetic-test-token';providerUnavailable=false;});
const authorities=getCACertificates('default'),requests:Array<{method:string;path:string;body:string}>=[];
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'admin-atlas-tls-'));
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-keyout',join(directory,'key.pem'),'-out',join(directory,'cert.pem')],{stdio:'ignore'});
 setDefaultCACertificates([...authorities,readFileSync(join(directory,'cert.pem'),'utf8')]);
 server=createServer({key:readFileSync(join(directory,'key.pem')),cert:readFileSync(join(directory,'cert.pem'))},async(req,res)=>{
  const url=new URL(req.url!,origin);let body='';for await(const chunk of req)body+=chunk;
  requests.push({method:req.method!,path:url.pathname+url.search,body});
  res.setHeader('content-type','application/json');
  if(req.headers.authorization!==`Bearer ${activeToken}`){res.statusCode=401;res.end(JSON.stringify({ok:false,message:'Not authenticated.'}));return;}
  if(url.pathname==='/v1/teams/team/capacity/provider-sessions'){res.statusCode=404;res.end(JSON.stringify({ok:false,message:'Retired provider route.'}));return;}
  if(url.pathname===catalogOperationPath(capacityStatus,{teamId:'team'},{})){
   if(providerUnavailable){res.statusCode=503;res.end(JSON.stringify({ok:false,message:'Provider observations unavailable.'}));return;}
   const items=[{id:'open-session',capacityProviderId:'provider',status:'open'},{id:'closed-session',capacityProviderId:'provider',status:'closed'}]
    .filter(value=>!url.searchParams.get('status')||value.status===url.searchParams.get('status'));
   res.end(JSON.stringify({ok:true,data:{items,page:{hasMore:false,nextCursor:null}}}));return;
  }
  const data=url.pathname==='/v1/teams'?[{id:'team',status:'active'}]:url.pathname==='/v1/projects'?{items:[{id:'project',teamId:'team',name:'Project'}]}:
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

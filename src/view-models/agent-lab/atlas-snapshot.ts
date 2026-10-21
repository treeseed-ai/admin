import {CONTROL_PLANE_OPERATIONS} from '@treeseed/sdk/operator-contracts';
import type {AgentAtlasProjection,AgentAtlasTopologySnapshot,AgentAtlasNodeState,AgentAtlasActivityItem} from '@treeseed/sdk/agent-capacity';
import type {ApiClientFacade} from '../../lib/market/api-client.ts';

export type AtlasRow=Record<string,unknown>;
export const row=(value:unknown):AtlasRow=>value&&typeof value==='object'&&!Array.isArray(value)?value as AtlasRow:{};
export const string=(value:unknown)=>typeof value==='string'?value:'';
export function localDate(value:string,timeZone:string):string{
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
 const part=(name:string)=>parts.find(p=>p.type===name)?.value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
export function atlasDate(date:string|null|undefined,timeZone:string):string{
 const value=date??localDate(new Date().toISOString(),timeZone);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw Object.assign(new Error('Choose a valid calendar date.'),{status:400});
 return value;
}
/** Convert a local calendar boundary to UTC without assuming a fixed offset (DST days vary). */
export function localDayBounds(date:string,timeZone:string):{start:string;end:string}{
 const boundary=(day:string)=>{
  const [year,month,dayOfMonth]=day.split('-').map(Number);
  const target=Date.UTC(year!,month!-1,dayOfMonth!);
  let guess=target;
  for(let i=0;i<4;i++){
   const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));
   const get=(name:string)=>Number(parts.find(p=>p.type===name)?.value);
   const represented=Date.UTC(get('year'),get('month')-1,get('day'),get('hour'),get('minute'),get('second'));
   const delta=target-represented;if(delta===0)break;guess+=delta;
  }
  return new Date(guess).toISOString();
 };
 const [year,month,dayOfMonth]=date.split('-').map(Number),next=new Date(Date.UTC(year!,month!-1,dayOfMonth!+1)).toISOString().slice(0,10);
 return {start:boundary(date),end:boundary(next)};
}
export async function readAtlasAssignments(api:ApiClientFacade,teamId:string):Promise<AtlasRow[]>{
 const rows:AtlasRow[]=[],ids=new Set<string>(),cursors=new Set<string>();let cursor:string|undefined;
 for(let page=0;page<100;page++){
  const result=row(await api.listProviderAssignments(teamId,{limit:100,...(cursor?{cursor}:{})}));
  const pagination=row(result.page);
  if(!Array.isArray(result.items)||typeof pagination.hasMore!=='boolean')throw new Error('Assignment inventory is incomplete.');
  for(const value of result.items){const item=row(value),id=string(item.id);
   if(!id||item.teamId!==teamId||!string(item.projectId)||ids.has(id))throw new Error('Assignment inventory has invalid ownership or duplicate identities.');
   ids.add(id);rows.push(item);
  }
  if(!pagination.hasMore)return rows;
  const next=string(pagination.nextCursor);if(!next||cursors.has(next))throw new Error('Assignment inventory cursor is incomplete.');
  cursors.add(next);cursor=next;
 }
 throw new Error('Assignment inventory exceeded its bounded page limit.');
}
/** Complete public run observations, not a claim that every producer emitted every transition. */
export async function readAtlasHistory(api:ApiClientFacade,teamId:string,runId:string):Promise<AgentAtlasActivityItem[]>{
 const observations:AgentAtlasActivityItem[]=[],ids=new Set<string>(),cursors=new Set<string>();let cursor:string|undefined;
 for(let page=0;page<100;page++){
  const result=row(await api.invoke(CONTROL_PLANE_OPERATIONS.workdays.events,{path:{teamId,runId},query:{limit:100,...(cursor?{cursor}:{})},body:undefined}));
  const pagination=row(result.page);
  if(!Array.isArray(result.items)||typeof pagination.hasMore!=='boolean')throw new Error('Workday event inventory is incomplete.');
  for(const value of result.items){
   const item=row(value),id=string(item.id),timestamp=string(item.createdAt),eventType=string(item.eventType),sequence=item.eventIndex;
   if(!id.trim()||ids.has(id)||item.teamId!==teamId||item.runId!==runId||(item.workdayId!==null&&item.workdayId!==runId)
    ||typeof sequence!=='number'||!Number.isSafeInteger(sequence)||sequence<0||!eventType.trim()
    ||!/^\d{4}-\d{2}-\d{2}T/.test(timestamp)||!timestamp.endsWith('Z')||!Number.isFinite(Date.parse(timestamp))
    ||new Date(timestamp).toISOString().slice(0,10)!==timestamp.slice(0,10)
    ||(item.title!==null&&typeof item.title!=='string')
    ||(item.projectId!==null&&typeof item.projectId!=='string')||(item.assignmentId!==null&&typeof item.assignmentId!=='string'))
    throw new Error('Workday event inventory has invalid scope, identity or observations.');
   ids.add(id);
   // Forward only the public display fields. Context/parameters/refs/metadata can contain protected payloads.
   observations.push({id,workdayId:runId,sequence,timestamp,category:'signal',direction:'internal',severity:'info',summary:string(item.title)||eventType,
    projectId:typeof item.projectId==='string'?item.projectId:null,agentId:null,activityProfile:null,signalContractId:null,
    assignmentId:typeof item.assignmentId==='string'?item.assignmentId:null,artifactRefs:[],metadata:{eventType}});
  }
  if(!pagination.hasMore){
   if(pagination.nextCursor!==null)throw new Error('Terminal workday event cursor is inconsistent.');
   observations.sort((a,b)=>a.sequence-b.sequence);
   if(observations.some((item,index)=>item.sequence!==index))throw new Error('Workday event history has missing or repeated indices.');
   return observations;
  }
  const next=string(pagination.nextCursor);if(!next||cursors.has(next))throw new Error('Workday event inventory cursor is incomplete.');
  cursors.add(next);cursor=next;
 }
 throw new Error('Workday event inventory exceeded its bounded page limit.');
}
const attempt=(assignment:AtlasRow)=>row(row(assignment.workspaceContext).assignmentAttempt);
const profile=(assignment:AtlasRow)=>row(row(attempt(assignment).effectiveProfile).profileRef);
const activity=(assignment:AtlasRow)=>string(row(attempt(assignment).effectiveProfile).activity);
export function scopedAtlasAssignments(assignments:AtlasRow[],timeZone:string,date:string,workday?:string|null):AtlasRow[]{
 return assignments.filter(a=>(!workday||a.workDayId===workday)&&localDate(string(a.assignedAt),timeZone)===date);
}
const validTimestamp=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&
 Number.isFinite(Date.parse(value))&&new Date(`${value.slice(0,10)}T00:00:00.000Z`).toISOString().slice(0,10)===value.slice(0,10);
const terminalTimestamp=(assignment:AtlasRow)=>{
 const field=assignment.status==='completed'?'completedAt':assignment.status==='failed'?'failedAt':assignment.status==='returned'?'returnedAt':null;
 return field&&validTimestamp(assignment[field])?assignment[field] as string:null;
};
/** Source-backed assignment intervals for a selected operating day. */
export function projectAtlasActivity(assignments:AtlasRow[],teamId:string,timeZone:string,date:string,workday?:string|null){
 const {start,end}=localDayBounds(date,timeZone),dayStart=Date.parse(start),dayEnd=Date.parse(end);
 const upserts=assignments.filter(a=>!workday||a.workDayId===workday).flatMap(a=>{
  const assignedAt=string(a.assignedAt),startAt=Date.parse(assignedAt),finishAt=terminalTimestamp(a);
  if(a.teamId!==teamId||!string(a.id)||(!Number.isSafeInteger(a.stateVersion)&&!(typeof a.stateVersion==='string'&&a.stateVersion.length>0))||!validTimestamp(assignedAt))throw new Error('Assignment activity inventory has invalid identity, version, ownership or start time.');
  if([a.completedAt,a.failedAt,a.returnedAt].some(value=>value!==null&&value!==undefined&&!validTimestamp(value))||
   (a.claimedAt!==null&&a.claimedAt!==undefined&&!validTimestamp(a.claimedAt)))throw new Error('Assignment activity inventory has invalid timestamps.');
  if(finishAt&&Date.parse(finishAt)<=startAt)throw new Error('Assignment activity inventory has an empty or inverted interval.');
  if(startAt>=dayEnd||(finishAt!==null&&Date.parse(finishAt)<=dayStart))return [];
  const attempt=row(row(a.workspaceContext).assignmentAttempt),effective=row(attempt.effectiveProfile),profileRef=row(effective.profileRef);
  const executionStartedAt=string(row(row(row(a.capacityEnvelope).budget).time).executionStartedAt);
  return [{id:string(a.id),stateVersion:a.stateVersion,teamId,workDayId:string(a.workDayId)||null,projectId:string(a.projectId),agentId:string(a.agentId)||null,
   agentClass:string(attempt.agentClass)||null,activity:string(effective.activity)||null,profileId:string(profileRef.id)||null,status:string(a.status),
   assignedAt,claimedAt:validTimestamp(a.claimedAt)?a.claimedAt:null,executionStartedAt:validTimestamp(executionStartedAt)?executionStartedAt:null,finishedAt:finishAt}];
 });
 upserts.sort((a,b)=>a.id.localeCompare(b.id));
 return {complete:true as const,teamId,date,workDayId:workday??null,timeZone,dayBounds:{start,end},upserts,removedIds:[] as string[]};
}
/** Adapt the complete scoped assignment inventory to the monitor's interval contract. */
export function projectAtlasMonitorActivity(assignments:AtlasRow[],projects:AtlasRow[],agents:AtlasRow[],teamId:string,timeZone:string,date:string,workday?:string|null){
 const complete=projectAtlasActivity(assignments,teamId,timeZone,date,workday);
 const projectById=new Map(projects.filter(p=>p.teamId===teamId).map(p=>[string(p.id),p]));
 // Assignment identities are project qualified. Catalog role slugs can repeat
 // between projects, so resolve the canonical definition identity in its owner.
 const agentById=new Map<string,AtlasRow>();
 for(const agent of agents){
  const projectId=string(agent.projectId),identity=string(row(agent.definition).id);
  if(!projectId||!identity)continue;
  const key=`${projectId}:${identity}`;
  if(agentById.has(key))throw new Error('Assignment activity display catalog is unavailable.');
  agentById.set(key,agent);
 }
 const upserts=complete.upserts.flatMap(item=>{
  const project=projectById.get(item.projectId),agent=agentById.get(`${item.projectId}:${item.agentId??''}`);
  if(!project||!agent)throw new Error('Assignment activity display catalog is unavailable.');
  const projectName=string(project.name),agentName=string(agent.displayName)||string(agent.name)||string(agent.title);
  if(!projectName||!agentName)throw new Error('Assignment activity display name is unavailable.');
  const stateVersion=Number(item.stateVersion);
  if(!Number.isSafeInteger(stateVersion)||stateVersion<0)throw new Error('Assignment activity version is unavailable.');
  const assignment=assignments.find(a=>string(a.id)===item.id)!;
  return [{id:item.id,stateVersion,projectId:item.projectId,projectName,
   agentId:item.agentId??'',agentName,agentClassId:item.agentClass??'',activityProfile:item.activity??'',assignmentId:item.id,
   executionId:string(assignment.executionId),status:item.status,startedAt:item.assignedAt,finishedAt:item.finishedAt}];
 });
 const liveIds=new Set(upserts.map(item=>item.id));
 const removedIds=assignments.filter(a=>a.teamId===teamId&&string(a.id)&&!liveIds.has(string(a.id))).map(a=>string(a.id));
 return {revision:complete.upserts.map(item=>`${item.id}:${item.stateVersion}`).join(',')||`${teamId}:${date}:${workday??''}:empty`,generatedAt:new Date().toISOString(),cursor:null,complete:true,upserts,removedIds};
}
async function digest(value:unknown){return 'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(byte=>byte.toString(16).padStart(2,'0')).join('');}
export async function projectAtlasAssignments(assignments:AtlasRow[],projects:AtlasRow[],teamId:string,timeZone:string,date:string,workday?:string|null,history:AgentAtlasActivityItem[]|null=null):Promise<AgentAtlasProjection>{
 const selected=scopedAtlasAssignments(assignments,timeZone,date,workday);
 const projectById=new Map(projects.filter(p=>p.teamId===teamId).map(p=>[string(p.id),p]));
 const topologies=new Map<string,AgentAtlasTopologySnapshot>(),states=new Map<string,AgentAtlasNodeState>();
 const generatedAt=new Date().toISOString();
 for(const assignment of selected){
  const projectId=string(assignment.projectId),ref=profile(assignment),commit=string(ref.commit),agentId=string(assignment.agentId);
  if(!projectById.has(projectId)||!agentId||!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(commit))throw new Error('Assignment definition authority is unavailable.');
  const key=projectId+':'+commit,projectNode='project:'+key,agentNode=agentId+'@'+commit.slice(0,8);
  let topology=topologies.get(key);
  if(!topology){topology={contract:'treeseed.agent-atlas-topology/v1',revision:key,projectId,immutableRef:commit,capturedAt:generatedAt,planningGraphRevision:String(assignment.graphRevision??''),
   nodes:[{id:projectNode,kind:'project',projectId,parentId:null,name:string(projectById.get(projectId)?.name)||projectId,slug:projectId,capacityClass:null,activityProfile:null,directGroupIds:[],effectiveGroupIds:[],contentPath:null,metadata:{provenance:'observed-assignment'}}],edges:[]};topologies.set(key,topology);}
  if(!topology.nodes.some(n=>n.id===agentNode))topology.nodes.push({id:agentNode,kind:'agent',projectId,parentId:projectNode,name:agentId,slug:agentId,capacityClass:string(attempt(assignment).agentClass)||null,activityProfile:activity(assignment)||null,directGroupIds:[],effectiveGroupIds:[],contentPath:string(ref.path)||null,metadata:{provenance:'observed-assignment'}});
  const related=selected.filter(a=>string(a.agentId)===agentId&&string(profile(a).commit)===commit);
  const latest=[...related].sort((a,b)=>string(b.updatedAt).localeCompare(string(a.updatedAt)))[0]!;
  const active=related.filter(a=>['pending','leased','running'].includes(string(a.status)));
  const elapsed=row(row(latest.assignmentResult).usage).elapsedSeconds;
  const executionStarted=string(row(row(row(latest.capacityEnvelope).budget).time).executionStartedAt);
  states.set(agentNode,{nodeId:agentNode,workdayIds:[...new Set(related.map(a=>string(a.workDayId)))],status:active.length?(executionStarted?'running':latest.status==='pending'?'queued':'waiting'):latest.status==='completed'?'completed':'degraded',progressPercent:null,elapsedSeconds:typeof elapsed==='number'?elapsed:null,timeboxSeconds:null,metrics:[],activeAssignmentIds:active.map(a=>string(a.id)),lastEventSequence:null,observedAt:string(latest.updatedAt)||null});
 }
 const summaries=selected.map(a=>({id:string(a.id),projectId:string(a.projectId),workdayId:string(a.workDayId),agentId:string(a.agentId)||null,name:`${string(a.agentId)} · ${activity(a)||string(a.mode)}`,status:string(a.status),progressPercent:null,startedAt:string(a.claimedAt)||null,finishedAt:string(a.completedAt)||string(a.returnedAt)||string(a.failedAt)||null,decisionId:string(a.decisionId)||null,proposalId:string(a.proposalId)||null,graphId:null,graphNodeId:string(a.executionNodeId)||null}));
 const revision=await digest({summaries,states:[...states.values()],definitions:[...topologies.keys()],history});
 return {revision,generatedAt,timeZone,scope:{teamId,selectedDate:date,workdayIds:workday&&history!==null?[workday]:[...new Set(summaries.map(a=>a.workdayId))],projectIds:[...new Set(summaries.map(a=>a.projectId))],groupIds:[],agentIds:[...new Set(summaries.flatMap(a=>a.agentId?[a.agentId]:[]))],activityProfiles:[...new Set(selected.map(activity).filter(Boolean))],sizingMetric:'activity'},topologies:[...topologies.values()],nodeStates:[...states.values()],assignments:summaries,activity:history??[],workdaySummary:null,
  activityWindow:{total:history?.length??0,loaded:history?.length??0,truncated:history===null},playback:{mode:'live',startedAt:[...selected.map(a=>string(a.assignedAt)),...(history??[]).map(e=>e.timestamp)].sort()[0]??generatedAt,endedAt:null,liveEdgeAt:generatedAt,cursor:{cursor:null,observedAt:generatedAt,positions:{}}},
  alerts:[...(history===null?[{id:'history-unavailable',severity:'warning' as const,message:'Complete scoped workday event history is unavailable; current assignment observations are retained.'}]:[]),{id:'inactive-topology-unavailable',severity:'warning',message:'Only observed assignment definitions are shown; inactive configured topology is unavailable.'}]};
}

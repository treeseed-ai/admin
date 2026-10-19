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

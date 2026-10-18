import type {ApiClientFacade} from '../../lib/market/api-client.ts';
import {row,string,type AtlasRow} from './atlas-snapshot.ts';

const failure=(status:number,message:string)=>Object.assign(new Error(message),{status});
export async function readAtlasAssignment(api:ApiClientFacade,teamId:string,id:string){
 const assignment=row(await api.request('GET',`/v1/teams/${encodeURIComponent(teamId)}/capacity/assignments/${encodeURIComponent(id)}`));
 if(assignment.id!==id||assignment.teamId!==teamId)throw failure(404,'Assignment is not available in this team.');
 return assignment;
}
async function readExactContent(api:ApiClientFacade,assignment:AtlasRow,reference:AtlasRow){
 const projectId=string(assignment.projectId),repository=string(reference.repository),commit=string(reference.commit),path=string(reference.path);
 if(reference.projectId&&reference.projectId!==projectId)throw failure(404,'Result is not available in this project.');
 if(!repository||!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(commit)||!path||path.startsWith('/')||path.split('/').includes('..'))throw failure(503,'Exact committed content authority is unavailable.');
 const library=row(await api.request('GET',`/v1/projects/${encodeURIComponent(projectId)}/treedx-library`));
 if(library.repositoryId!==repository)throw failure(404,'Content does not resolve to this project library.');
 const response=row(await api.request('POST',`/v1/dx/projects/${encodeURIComponent(projectId)}/repos/${encodeURIComponent(repository)}/files/read`,{body:{ref:commit,paths:[path],encoding:'utf8',parseFrontmatter:true}}));
 const result=row(response.result??response);const files=Array.isArray(result.files)?result.files:[];
 const file=row(files[0]);
 if(result.ok!==true||result.ref!==commit||files.length!==1||file.path!==path||typeof file.content!=='string')throw failure(503,'Exact content read-back is incomplete.');
 return {body:typeof file.body==='string'?file.body:file.content,commit,path,repository};
}
export async function atlasDetail(api:ApiClientFacade,teamId:string,kind:string,id:string,observedAt?:string|null){
 if(observedAt&&(!Number.isFinite(Date.parse(observedAt))||Date.parse(observedAt)>Date.now()))throw failure(400,'Choose a valid observed snapshot time.');
 if(kind==='artifact'){
  const separator=id.lastIndexOf(':');const assignmentId=id.slice(0,separator),index=Number(id.slice(separator+1));
  if(separator<1||!/^\d+$/.test(id.slice(separator+1))||!Number.isSafeInteger(index))throw failure(400,'Choose an assignment result reference.');
  const assignment=await readAtlasAssignment(api,teamId,assignmentId),result=row(assignment.assignmentResult);
  if(observedAt&&Date.parse(string(assignment.updatedAt))>Date.parse(observedAt))throw failure(409,'Assignment changed; refresh the current snapshot.');
  const references=Array.isArray(result.references)?result.references:[];const reference=row(references[index]);
  if(reference.kind!=='treedx')throw failure(404,'This committed TreeDX result is unavailable.');
  const content=await readExactContent(api,assignment,reference);
  return {title:content.path,status:'committed',description:content.body,summary:{assignment:assignmentId,commit:content.commit,repository:content.repository,path:content.path},data:content};
 }
 if(kind==='assignment'){
  const assignment=await readAtlasAssignment(api,teamId,id),result=row(assignment.assignmentResult),attempt=row(row(assignment.workspaceContext).assignmentAttempt);
  if(observedAt&&Date.parse(string(assignment.updatedAt))>Date.parse(observedAt))throw failure(409,'Assignment changed; refresh the current snapshot.');
  let task='The exact task source is unavailable.';
  try{task=(await readExactContent(api,assignment,row(attempt.sourceRef))).body;}catch(error){if([401,403,404].includes(Number(row(error).status)))throw error;}
  const references=Array.isArray(result.references)?result.references:[];
  return {title:`${string(assignment.agentId)} · ${id}`,status:assignment.status,description:task,
   summary:{status:assignment.status,agent:assignment.agentId,workday:assignment.workDayId,result:result.summary??'No completed result was reported.',elapsedSeconds:row(result.usage).elapsedSeconds??null,failure:assignment.lifecycleReason??null,leaseState:assignment.leaseState,cleanup:row(row(assignment.lifecycleOutput).teardown).verified===true?'Verified':'Not verified'},
   data:{id,projectId:assignment.projectId,workdayId:assignment.workDayId,status:assignment.status,result:result.summary??null,usage:{elapsedSeconds:row(result.usage).elapsedSeconds??null,modelInputTokens:row(result.usage).modelInputTokens??null,modelOutputTokens:row(result.usage).modelOutputTokens??null}},
   related:references.flatMap((value,index)=>row(value).kind==='treedx'?[{kind:'artifact',id:`${id}:${index}`,title:string(row(value).path)||'Committed result'}]:[])};
 }
 throw failure(503,'This Atlas record has no canonical detail reader yet.');
}

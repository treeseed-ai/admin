import type {APIContext} from 'astro';
import {ApiClientFacade} from '../../lib/market/api-client.ts';
import {loadAppContext} from '../app-access.ts';
import {loadAgentLabFrame} from './agent-lab-frame.ts';
import {atlasDetail} from './atlas-detail.ts';
import {row,string} from './atlas-snapshot.ts';

export const atlasJson=(payload:unknown,status=200)=>Response.json({ok:status<400,payload},{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function atlasContext(context:APIContext){
 if(!context.locals.auth?.principal)throw Object.assign(new Error('Sign in to inspect agent work.'),{status:401});
 const app=await loadAppContext(context);if(!app.activeTeam)throw Object.assign(new Error('Choose an active team.'),{status:403});
 return {api:new ApiClientFacade(context),team:app.activeTeam};
}
export async function atlasProjection(context:APIContext){
 if(context.url.searchParams.has('at'))throw Object.assign(new Error('Historical assignment playback is unavailable; return to the current snapshot.'),{status:503});
 const {api,team}=await atlasContext(context);const preferences=await api.accountPreferences();
 const frame=await loadAgentLabFrame(api,team,preferences,{date:context.url.searchParams.get('date'),workday:context.url.searchParams.get('workday')});
 if(frame.atlas.revision==='server-snapshot-unavailable')throw Object.assign(new Error('The complete assignment snapshot is unavailable.'),{status:503});
 return frame.atlas;
}
export async function atlasDetailResponse(context:APIContext){
 const {api,team}=await atlasContext(context);
 let kind:string,id:string;
 try{kind=decodeURIComponent(string(context.params.kind));id=decodeURIComponent(string(context.params.id));}
 catch{throw Object.assign(new Error('Choose a valid Atlas record locator.'),{status:400});}
 return atlasJson(await atlasDetail(api,team.id,kind,id,context.url.searchParams.get('at')));
}
export const atlasError=(error:unknown)=>atlasJson({message:error instanceof Error?error.message:'Agent observations are unavailable.'},[400,401,403,404,409].includes(Number(row(error).status))?Number(row(error).status):503);

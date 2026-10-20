import type {APIRoute} from 'astro';
import {atlasContext,atlasJson,atlasError} from '../../../../view-models/agent-lab/atlas-response.ts';
import {atlasDate,projectAtlasActivity,readAtlasAssignments} from '../../../../view-models/agent-lab/atlas-snapshot.ts';

export const prerender=false;
export const GET:APIRoute=async context=>{
 try{
  const {api,team}=await atlasContext(context),preferences=await api.accountPreferences();
  const date=atlasDate(context.url.searchParams.get('date'),preferences.timeZone),workday=context.url.searchParams.get('workday');
  const assignments=await readAtlasAssignments(api,team.id);
  return atlasJson(projectAtlasActivity(assignments,team.id,preferences.timeZone,date,workday));
 }catch(error){return atlasError(error);}
};

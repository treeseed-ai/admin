import type {APIRoute} from 'astro';
import {atlasContext,atlasJson,atlasError} from '../../../../view-models/agent-lab/atlas-response.ts';
import {atlasDate} from '../../../../view-models/agent-lab/atlas-snapshot.ts';
import {loadAgentLabFrame} from '../../../../view-models/agent-lab/agent-lab-frame.ts';

export const prerender=false;
export const GET:APIRoute=async context=>{
 try{
  const {api,team}=await atlasContext(context),preferences=await api.accountPreferences();
  const date=atlasDate(context.url.searchParams.get('date'),preferences.timeZone),workday=context.url.searchParams.get('workday');
  const frame=await loadAgentLabFrame(api,team,preferences,{date,workday});
  if(frame.activity.revision==='activity-unavailable')throw Object.assign(new Error('The complete scoped assignment activity is unavailable.'),{status:503});
  return atlasJson(frame.activity);
 }catch(error){return atlasError(error);}
};

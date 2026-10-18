import type {APIRoute} from 'astro';
import {atlasProjection,atlasJson,atlasError} from '../../../../view-models/agent-lab/atlas-response.ts';
export const prerender=false;
export const GET:APIRoute=async context=>{try{return atlasJson(await atlasProjection(context));}catch(error){return atlasError(error);}};

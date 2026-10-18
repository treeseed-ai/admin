import type {APIRoute} from 'astro';
import {atlasDetailResponse,atlasError} from '../../../../../../view-models/agent-lab/atlas-response.ts';
export const prerender=false;
export const GET:APIRoute=async context=>{try{return await atlasDetailResponse(context);}catch(error){return atlasError(error);}};

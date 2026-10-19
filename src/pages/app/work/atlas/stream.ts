import type {APIRoute} from 'astro';
import {atlasProjection,atlasError} from '../../../../view-models/agent-lab/atlas-response.ts';
export const prerender=false;
export const GET:APIRoute=async context=>{
 let initial;try{initial=await atlasProjection(context);}catch(error){return atlasError(error);}
 let timer:ReturnType<typeof setTimeout>|undefined,closed=false,onAbort=()=>{};
 const encoder=new TextEncoder();
 const close=()=>{closed=true;if(timer)clearTimeout(timer);context.request.signal.removeEventListener('abort',onAbort);};
 const stream=new ReadableStream<Uint8Array>({
  start(controller){
   if(context.request.signal.aborted){close();controller.close();return;}
   let revision=context.url.searchParams.get('revision');
   const send=(value:typeof initial)=>{if((controller.desiredSize??1)<=0)throw new Error('Atlas observation consumer is not reading.');if(revision!==value.revision){controller.enqueue(encoder.encode(`event: atlas.delta\ndata: ${JSON.stringify({revision:value.revision})}\n\n`));revision=value.revision;}else controller.enqueue(encoder.encode(': current assignment snapshot\n\n'));};
   send(initial);
   const poll=async()=>{if(closed)return;try{const snapshot=await atlasProjection(context);if(closed)return;send(snapshot);timer=setTimeout(poll,5000);}catch(error){if(!closed){
    const reading=(controller.desiredSize??0)>0;
    close();
    if(!reading){controller.error(new Error('Atlas observation consumer is not reading.'));return;}
    const code=error&&typeof error==='object'&&'status'in error?error.status:undefined;
    const status=typeof code==='number'&&[400,401,403,404,409].includes(code)?code:503;
    // A denied/unavailable snapshot is not an unhandled application exception.
    // End this request; EventSource reconnects through fresh HTTP authorization.
    // Never send private upstream diagnostics or imply that stale data is live.
    controller.enqueue(encoder.encode(`event: atlas.unavailable\ndata: ${JSON.stringify({status})}\n\n`));
    controller.close();
   }}};
   onAbort=()=>{if(!closed){close();controller.close();}};
   timer=setTimeout(poll,5000);context.request.signal.addEventListener('abort',onAbort,{once:true});
  },cancel:close,
 });
 return new Response(stream,{headers:{'content-type':'text/event-stream','cache-control':'private, no-store','x-accel-buffering':'no'}});
};

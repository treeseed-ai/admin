type ActionRow={ id:string;kind:string;payload_json:string };
type ActionEvent=(name:string,detail:Record<string,unknown>)=>void;
const capabilities=['navigate','reveal-resource','set-view-filter','populate-draft','present-confirmation'];
function object(value:unknown){return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}
function parse(value:string){try{return object(JSON.parse(value));}catch{return {};}}
function event(name:string,detail:Record<string,unknown>){window.dispatchEvent(new CustomEvent(name,{detail}));}
export function resolveClientAction(action:ActionRow,emit:ActionEvent){
	const payload=parse(action.payload_json);
	if(action.kind==='navigate'){
		const path=typeof payload.path==='string'?payload.path:'';
		if(!path.startsWith('/app/'))throw new Error('Navigation is restricted to authenticated application routes.');
		return {path};
	}
	if(action.kind==='reveal-resource'){emit('treeseed:client-action:reveal-resource',payload);return payload;}
	if(action.kind==='set-view-filter'){emit('treeseed:client-action:set-view-filter',payload);return payload;}
	if(action.kind==='populate-draft'){emit('treeseed:client-action:populate-draft',payload);return payload;}
	if(action.kind==='present-confirmation'){emit('treeseed:client-action:present-confirmation',payload);return payload;}
	throw new Error('Unsupported semantic client action.');
}
async function execute(action:ActionRow){return resolveClientAction(action,event);}
async function json(url:string,init?:RequestInit){const response=await fetch(url,{...init,credentials:'same-origin',headers:{accept:'application/json','content-type':'application/json',...(init?.headers??{})}});if(!response.ok)throw new Error(`Client action API failed with HTTP ${response.status}.`);return response.json();}

export function startClientActionExecutor(){
	const host=document.querySelector<HTMLElement>('[data-client-action-project]'); const projectId=host?.dataset.clientActionProject??location.pathname.match(/^\/app\/projects\/([^/]+)/u)?.[1];
	if(!projectId)return()=>undefined;
	const key=`treeseed:client-session:${projectId}`; const sessionId=sessionStorage.getItem(key)??crypto.randomUUID(); sessionStorage.setItem(key,sessionId);
	let stopped=false; let timer:number|undefined;
	const register=()=>json('/v1/client-sessions',{method:'POST',body:JSON.stringify({sessionId,projectId,route:`${location.pathname}${location.search}`,capabilities})});
	const result=(action:ActionRow,status:'completed'|'rejected'|'failed',detail:Record<string,unknown>)=>json(`/v1/client-sessions/${encodeURIComponent(sessionId)}/actions/${encodeURIComponent(action.id)}/result`,{method:'POST',body:JSON.stringify({status,detail})});
	const tick=async()=>{
		try{
			await json(`/v1/client-sessions/${encodeURIComponent(sessionId)}/heartbeat`,{method:'POST',body:'{}'}).catch(register);
			const envelope=await json(`/v1/client-sessions/${encodeURIComponent(sessionId)}/actions`); const actions=Array.isArray(envelope.payload)?envelope.payload as ActionRow[]:[];
			for(const action of actions){try{const detail=object(await execute(action));await result(action,'completed',detail);if(action.kind==='navigate'&&typeof detail.path==='string')window.location.assign(new URL(detail.path,window.location.origin));}catch(error){await result(action,'failed',{message:error instanceof Error?error.message:String(error)});}}
		}catch{/* Heartbeat expiry makes requests unavailable without blocking the provider. */}
		if(!stopped)timer=window.setTimeout(tick,5_000);
	};
	void register().then(tick).catch(()=>{timer=window.setTimeout(tick,5_000);});
	return()=>{stopped=true;if(timer)window.clearTimeout(timer);};
}

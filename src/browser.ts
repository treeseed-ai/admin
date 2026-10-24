import {Context,Service} from 'cordis';
interface StatusReader {read():Promise<unknown>;}
class StatusClient implements StatusReader {async read():Promise<unknown>{const response=await fetch('/admin/status',{credentials:'same-origin',cache:'no-store',redirect:'error'});if(!response.ok)throw new Error('Status unavailable');return response.json();}}
class HttpStatusPlugin {static readonly provide=['admin.browser.status'];constructor(context:Context){context.provide('admin.browser.status',new StatusClient());}}
class StatusPagePlugin {
 static readonly inject=['admin.browser.status'];
 constructor(private readonly context:Context){}
 async [Service.init]():Promise<void>{const reader=Reflect.get(this.context,'admin.browser.status') as StatusReader,element=document.getElementById('installed-status');if(!element)throw new Error('Status element missing');try{element.textContent=JSON.stringify(await reader.read(),null,2);element.setAttribute('data-loaded','true');}catch{element.textContent='Installed status is unavailable.';element.setAttribute('data-loaded','failed');}}
}
export class AdminBrowserApplication {static async start():Promise<void>{if(typeof document==='undefined')return;const context=new Context();await context.plugin(HttpStatusPlugin);await context.plugin(StatusPagePlugin);}}
await AdminBrowserApplication.start();

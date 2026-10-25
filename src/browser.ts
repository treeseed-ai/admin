import {Context,type ProviderRegistration,CordisComposition,CordisServiceLocator,type CompositionHandle,type ProviderLease} from '@treeseed-cordis/sdk/composition';
import {Service} from 'cordis';
import {CapabilityToken,ProviderV4Schemas,PlatformSchemas,type NativeProviderDeclaration} from '@treeseed-cordis/sdk/portable';
import {UiBrowserApplication} from '@treeseed-cordis/ui/browser';
import {type UiMount,type UiActionDispatcher,type UiActionResult} from '@treeseed-cordis/ui/contracts';
import {AdminViews,AdminPackageIdentity} from './views.js';
export interface StatusReader {read():Promise<unknown>;presentation():Promise<string>;logout(csrf:string):Promise<void>;}
export interface AdminPresentationState{open(actions:UiActionDispatcher,assetGeneration:string):Promise<void>;refresh(value:unknown):Promise<void>;close():Promise<void>;}
export interface AdminNavigation {navigate(path:string):void;}
class BrowserAdapter<T extends object>{constructor(private readonly methods:string[]){}parse(value:unknown):T{if(!value||typeof value!=='object')throw new Error('ADMIN_BROWSER_PROVIDER_UNAVAILABLE');for(const method of this.methods)if(typeof Reflect.get(value,method)!=='function')throw new Error('ADMIN_BROWSER_PROVIDER_UNAVAILABLE');return value as T;}}
export class AdminBrowserTokens {
 static readonly status=new CapabilityToken<StatusReader>('admin.browser.status',ProviderV4Schemas.version,new BrowserAdapter<StatusReader>(['read','presentation','logout']));
 static readonly presentation=new CapabilityToken<AdminPresentationState>('admin.browser.presentation',ProviderV4Schemas.version,new BrowserAdapter<AdminPresentationState>(['open','refresh','close']));
 static readonly navigation=new CapabilityToken<AdminNavigation>('admin.browser.navigation',ProviderV4Schemas.version,new BrowserAdapter<AdminNavigation>(['navigate']));
 static readonly actions=new CapabilityToken<UiActionDispatcher>('admin.browser.actions',ProviderV4Schemas.version,new BrowserAdapter<UiActionDispatcher>(['invoke']));
 static readonly page=new CapabilityToken<{close():Promise<void>}>('admin.browser.page',ProviderV4Schemas.version,new BrowserAdapter<{close():Promise<void>}>(['close']));
}
class BrowserDeclaration {
 static readonly replacement=Object.freeze({kind:'restart' as const,stateVersion:1,qualificationDigest:null});
 static create(id:string,capability:string,inject:string[]):NativeProviderDeclaration{return ProviderV4Schemas.declaration.parse({id,pluginId:'admin',capability,contractVersion:ProviderV4Schemas.version,target:'browser',provide:[capability],inject});}
}
export class StatusClient implements StatusReader {
 private async request(path:string,options:RequestInit={}):Promise<unknown>{const response=await fetch(path,{credentials:'same-origin',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000),...options});if(!response.ok||!response.headers.get('content-type')?.startsWith('application/json')||Number(response.headers.get('content-length')??0)>1024*1024)throw new Error('ADMIN_REQUEST_REFUSED');const reader=response.body?.getReader();if(!reader)throw new Error('ADMIN_REQUEST_REFUSED');const chunks:Uint8Array[]=[];let size=0;try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1024*1024)throw new Error('ADMIN_RESPONSE_LIMIT');chunks.push(part.value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));}finally{await reader.cancel();reader.releaseLock();}}
 read():Promise<unknown>{return this.request('/admin/status');}
 async presentation():Promise<string>{const value=await this.request('/admin/presentation'),digest=value&&typeof value==='object'?Reflect.get(value,'assetGeneration'):undefined;return PlatformSchemas.digest.parse(digest);}
 async logout(csrf:string):Promise<void>{const value=await this.request('/admin/logout',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body:new URLSearchParams({csrf}).toString()});if(!value||typeof value!=='object'||Reflect.get(value,'success')!==true)throw new Error('ADMIN_LOGOUT_REFUSED');}
}
export class HttpStatusPlugin extends StatusClient {
 static readonly declaration=BrowserDeclaration.create('admin.browser.status.default',AdminBrowserTokens.status.id,[]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=BrowserDeclaration.replacement;
 constructor(context:Context){super();context.provide(AdminBrowserTokens.status.id,this);}
}
export class AdminBrowserState implements AdminPresentationState {
 private mount:UiMount|undefined;private closed=false;
 async open(actions:UiActionDispatcher,assetGeneration:string):Promise<void>{if(this.mount||this.closed)throw new Error('ADMIN_PRESENTATION_CLOSED');this.mount=await UiBrowserApplication.hydrateDocument({actions,actionIds:['admin.refresh','admin.logout'],assetGeneration});}
 async refresh(value:unknown):Promise<void>{if(!this.mount||this.closed)throw new Error('ADMIN_PRESENTATION_CLOSED');await this.mount.update(AdminViews.refreshed(this.mount.view(),value));}
 async close():Promise<void>{this.closed=true;await this.mount?.dispose();}
}
export class AdminBrowserStatePlugin extends AdminBrowserState {
 static readonly declaration=BrowserDeclaration.create('admin.browser.presentation.default',AdminBrowserTokens.presentation.id,[]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=BrowserDeclaration.replacement;
 constructor(context:Context){super();context.provide(AdminBrowserTokens.presentation.id,this);}
}
export class AdminNavigationPlugin implements AdminNavigation {
 static readonly declaration=BrowserDeclaration.create('admin.browser.navigation.default',AdminBrowserTokens.navigation.id,[AdminBrowserTokens.presentation.id]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=BrowserDeclaration.replacement;
 private destination:string|null=null;private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private readonly context:Context){context.provide(AdminBrowserTokens.navigation.id,this);}
 navigate(path:string):void{if(path!=='/admin'||this.destination)throw new Error('ADMIN_NAVIGATION_REFUSED');this.destination=path;this.timer=setTimeout(this.leave.bind(this),0);}
 [Service.init]():()=>void{return this.cancel.bind(this);}
 private cancel():void{clearTimeout(this.timer);}
 private async leave():Promise<void>{try{await AdminBrowserTokens.presentation.parse(Reflect.get(this.context,AdminBrowserTokens.presentation.id)).close();window.location.assign(this.destination!);}catch{console.error('ADMIN_NAVIGATION_FAILED');}}
}
export class AdminActionsPlugin implements UiActionDispatcher {
 static readonly declaration=BrowserDeclaration.create('admin.browser.actions.default',AdminBrowserTokens.actions.id,[AdminBrowserTokens.status.id,AdminBrowserTokens.presentation.id,AdminBrowserTokens.navigation.id]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=BrowserDeclaration.replacement;
 constructor(private readonly context:Context){context.provide(AdminBrowserTokens.actions.id,this);}
 async invoke(actionId:string,input:Readonly<Record<string,string>>):Promise<UiActionResult>{const reader=AdminBrowserTokens.status.parse(Reflect.get(this.context,AdminBrowserTokens.status.id));try{if(actionId==='admin.refresh'){await AdminBrowserTokens.presentation.parse(Reflect.get(this.context,AdminBrowserTokens.presentation.id)).refresh(await reader.read());return {success:true,message:'Status refreshed'};}if(actionId==='admin.logout'&&typeof input.csrf==='string'&&/^[a-f0-9]{64}$/.test(input.csrf)){await reader.logout(input.csrf);AdminBrowserTokens.navigation.parse(Reflect.get(this.context,AdminBrowserTokens.navigation.id)).navigate('/admin');return {success:true,message:'Signed out'};}return {success:false,message:'Action refused'};}catch{return {success:false,message:'Request unavailable'};}}
}
export class StatusPagePlugin {
 static readonly declaration=BrowserDeclaration.create('admin.browser.page.default',AdminBrowserTokens.page.id,[AdminBrowserTokens.status.id,AdminBrowserTokens.presentation.id,AdminBrowserTokens.actions.id]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=BrowserDeclaration.replacement;
 constructor(private readonly context:Context){}
 async [Service.init]():Promise<()=>Promise<void>>{const state=AdminBrowserTokens.presentation.parse(Reflect.get(this.context,AdminBrowserTokens.presentation.id)),reader=AdminBrowserTokens.status.parse(Reflect.get(this.context,AdminBrowserTokens.status.id));await state.open(AdminBrowserTokens.actions.parse(Reflect.get(this.context,AdminBrowserTokens.actions.id)),await reader.presentation());this.context.provide(AdminBrowserTokens.page.id,state);return state.close.bind(state);}
}
export class AdminBrowserApplication {
 private disposal:Promise<void>|null=null;
 private constructor(private readonly handle:CompositionHandle,private readonly lease:ProviderLease<{close():Promise<void>}>){window.addEventListener('pagehide',this.pageHide);}
 private readonly pageHide=this.stop.bind(this);
 private stop():void{void this.dispose().catch(AdminBrowserApplication.failed);}
 static failed():void{console.error('ADMIN_BROWSER_UNAVAILABLE');}
 static async start():Promise<AdminBrowserApplication|undefined>{if(typeof document==='undefined')return;const scopeId='admin.browser',registrations:ProviderRegistration[]=[],artifact={kind:'bundled' as const,identity:AdminPackageIdentity.artifact};for(const [token,plugin] of [[AdminBrowserTokens.presentation,AdminBrowserStatePlugin],[AdminBrowserTokens.status,HttpStatusPlugin],[AdminBrowserTokens.navigation,AdminNavigationPlugin],[AdminBrowserTokens.actions,AdminActionsPlugin],[AdminBrowserTokens.page,StatusPagePlugin]] as const)registrations.push({token,plugin,declaration:plugin.declaration,configuration:{},artifact});const selections=[];for(const registration of registrations)selections.push({scopeId,capability:registration.token.id,providerId:ProviderV4Schemas.declaration.parse(registration.declaration).id});const handle=await CordisComposition.start({registrations,selections},{scopeId,target:'browser',principalId:'session-bound-browser',resourceScope:window.location.origin});try{const receiver:{context?:Context}={};class PageConsumer{static readonly inject=['cordis.composition',AdminBrowserTokens.page.id];constructor(context:Context){receiver.context=context;}}await handle.mount(PageConsumer,undefined);return new AdminBrowserApplication(handle,await CordisServiceLocator.from(receiver.context!).acquire(AdminBrowserTokens.page));}catch(error){await handle.dispose();throw error;}}
 dispose():Promise<void>{if(!this.disposal)this.disposal=this.close();return this.disposal;}
 private async close():Promise<void>{window.removeEventListener('pagehide',this.pageHide);try{await this.lease.value.close();}finally{try{await this.lease.release();}finally{await this.handle.dispose();}}}
}
await AdminBrowserApplication.start();

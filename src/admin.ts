import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {CapabilityToken,ProviderV4Schemas,ServiceTokens,PlatformSchemas,PackageDefinition,InstalledSchemas,CanonicalJson,type NativeProviderDeclaration,type ProviderArtifact,type PlatformInvoker,type ServerConfiguration,type TrustedPrincipal} from '@treeseed-cordis/sdk';
import {Context,type ProviderRegistration} from '@treeseed-cordis/sdk/runtime';
import {Service} from 'cordis';
import {UiServerRenderer,type UiServerRendering} from '@treeseed-cordis/ui/server';
import {AdminViews,AdminPackageIdentity} from './views.js';
import {AdminAssetCatalog,type AdminAssets} from './assets.js';
export {AdminAssetCatalog,type AdminAssets,type AdminPublicAsset} from './assets.js';
import {IdentitySessionsToken,type IdentitySessions} from '@treeseed-cordis/identity';
export interface AdminContribution {handle(request:Request):Promise<Response|null>;assetDigest():string;}
class AdminAdapter {parse(value:unknown):AdminContribution{if(!value||typeof (value as AdminContribution).handle!=='function'||typeof (value as AdminContribution).assetDigest!=='function')throw new Error('Admin unavailable');return value as AdminContribution;}}
export const AdminToken=new CapabilityToken<AdminContribution>('admin.routes',ProviderV4Schemas.version,new AdminAdapter());
export class AdminRoutes implements AdminContribution {
 constructor(private readonly sessions:IdentitySessions,private readonly invoker:PlatformInvoker,private readonly settings:ServerConfiguration,private readonly assets:AdminAssets,private readonly presentation:UiServerRendering){if(assets.digest()!==settings.assetDigest)throw new Error('Admin asset mismatch');}
 assetDigest():string{return this.assets.digest();}
 static cookie(header:string,name:string):string{let result='',found=false;for(const item of header.split(';')){const index=item.indexOf('=');if(index<0||item.slice(0,index).trim()!==name)continue;if(found)return '';found=true;result=item.slice(index+1).trim();}return result;}
 private response(body:BodyInit|null,status=200,headers:Record<string,string>={}):Response{return new Response(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",...headers}});}
 private redirect(location:string,cookies:string[]):Response{const response=this.response(null,303,{Location:location});for(const cookie of cookies)response.headers.append('Set-Cookie',cookie);return response;}
 static sessionCookieName(settings:Pick<ServerConfiguration,'installationId'|'origin'>):string{return '__Host-cordis-'+CanonicalJson.digest({installationId:settings.installationId,origin:settings.origin}).slice(0,16);}
 private cookieValue(name:string,value:string,seconds:number):string{return name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+seconds;}
 async handle(request:Request):Promise<Response|null>{const url=new URL(request.url);if(url.origin!==this.settings.origin)return this.response('Origin refused',400);const path=url.pathname,header=request.headers.get('cookie')??'',sessionName=AdminRoutes.sessionCookieName(this.settings),stateName=sessionName+'-state',session=AdminRoutes.cookie(header,sessionName);
  const asset=this.assets.asset(path);if(asset&&request.method==='GET')return this.response(new Uint8Array(asset.bytes),200,{'Content-Type':asset.contentType,'Cache-Control':'public, max-age=31536000, immutable'});
  if(path==='/admin/login'&&request.method==='GET'){const login=await this.sessions.login();return this.redirect(login.location,[this.cookieValue(stateName,login.state,300)]);}
  if(path==='/admin/callback'&&request.method==='GET'){try{const cookie=await this.sessions.callback(url,AdminRoutes.cookie(header,stateName));return this.redirect('/admin',[this.cookieValue(sessionName,cookie,28800),this.cookieValue(stateName,'',0)]);}catch{return this.response('Identity callback refused',401);}}
  if(!['/admin','/admin/','/admin/status','/admin/logout','/admin/presentation'].includes(path))return null;
  const principal=await this.sessions.principal(session);if(!principal||!principal.scopes.includes('platform.read'))return path==='/admin'||path==='/admin/'?this.redirect('/admin/login',[]):this.response('Authentication required',401);
  if(path==='/admin/presentation'&&request.method==='GET')return this.response(JSON.stringify({assetGeneration:this.assetDigest()}),200,{'Content-Type':'application/json'});
  if(path==='/admin/status'&&request.method==='GET')return this.response(JSON.stringify(await this.invoker.invoke('platform.status',{},principal)),200,{'Content-Type':'application/json'});
  if(path==='/admin/logout'&&request.method==='POST'){if(request.headers.get('origin')!==this.settings.origin||Number(request.headers.get('content-length')??0)>4096)return this.response('Origin refused',403);const body=await request.text();if(body.length>4096||new URLSearchParams(body).get('csrf')!==this.csrf(session,principal))return this.response('Request refused',403);await this.sessions.logout(session);if(request.headers.get('accept')==='application/json')return this.response(JSON.stringify({success:true}),200,{'Content-Type':'application/json','Set-Cookie':this.cookieValue(sessionName,'',0)});return this.redirect('/admin',[this.cookieValue(sessionName,'',0)]);}
  if((path==='/admin'||path==='/admin/')&&request.method==='GET'){const page=await this.presentation.document({title:'Cordis installed status',view:AdminViews.initial(this.settings.installationId,this.csrf(session,principal)),script:this.assets.script(),assetGeneration:this.assetDigest(),actionIds:['admin.refresh','admin.logout']});return this.response(page.html,200,{'Content-Type':'text/html; charset=utf-8'});}
  return this.response('Method refused',405);
 }
 private csrf(session:string,principal:TrustedPrincipal):string{return CanonicalJson.digest({purpose:'logout',session,principal:principal.principalId});}
}
class AdminValidator<T extends object>{constructor(private readonly methods:string[]){}parse(value:unknown):T{if(!value||typeof value!=='object')throw new Error('ADMIN_PROVIDER_UNAVAILABLE');for(const method of this.methods)if(typeof Reflect.get(value,method)!=='function')throw new Error('ADMIN_PROVIDER_UNAVAILABLE');return value as T;}}
export const AdminAssetsToken=new CapabilityToken<AdminAssets>('admin.assets',ProviderV4Schemas.version,new AdminValidator<AdminAssets>(['digest','script','asset']));
export const AdminPresentationToken=new CapabilityToken<UiServerRendering>('admin.presentation',ProviderV4Schemas.version,new AdminValidator<UiServerRendering>(['render','document','styles']));
class AdminDeclaration{static readonly replacement=Object.freeze({kind:'restart' as const,stateVersion:1,qualificationDigest:null});static create(id:string,capability:string,inject:string[]):NativeProviderDeclaration{return ProviderV4Schemas.declaration.parse({id,pluginId:'admin',capability,contractVersion:ProviderV4Schemas.version,target:'api',provide:[capability],inject});}}
export class AdminAssetsPlugin {
 static readonly declaration=AdminDeclaration.create('admin.assets.default',AdminAssetsToken.id,[]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=AdminDeclaration.replacement;
 constructor(context:Context){context.provide(AdminAssetsToken.id,new AdminAssetCatalog());}
}
export class AdminPresentationPlugin {
 static readonly declaration=AdminDeclaration.create('admin.presentation.default',AdminPresentationToken.id,[AdminAssetsToken.id]);static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=PlatformSchemas.empty;static readonly replacement=AdminDeclaration.replacement;
 constructor(private readonly context:Context){}
 async [Service.init]():Promise<()=>Promise<void>>{const renderer=await UiServerRenderer.create();try{const style=await renderer.styles(),asset=AdminAssetsToken.parse(Reflect.get(this.context,AdminAssetsToken.id)).asset(style.path);if(!asset||asset.sha256!==style.digest||new TextDecoder().decode(asset.bytes)!==style.css)throw new Error('ADMIN_STYLE_MISMATCH');this.context.provide(AdminPresentationToken.id,renderer);return renderer.dispose.bind(renderer);}catch(error){await renderer.dispose();throw error;}}
}
export class AdminPlugin {
 static readonly declaration=AdminDeclaration.create('installed-admin',AdminToken.id,[IdentitySessionsToken.id,ServiceTokens.invoker.id,AdminAssetsToken.id,AdminPresentationToken.id]);
 static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=InstalledSchemas.serverConfiguration;static readonly replacement=AdminDeclaration.replacement;
 constructor(context:Context,settings:ServerConfiguration){context.provide(AdminToken.id,new AdminRoutes(IdentitySessionsToken.parse(Reflect.get(context,IdentitySessionsToken.id)),ServiceTokens.invoker.parse(Reflect.get(context,ServiceTokens.invoker.id)),settings,AdminAssetsToken.parse(Reflect.get(context,AdminAssetsToken.id)),AdminPresentationToken.parse(Reflect.get(context,AdminPresentationToken.id))));}
}
export class AdminComposition {
 static registrations(settings:ServerConfiguration,artifact:ProviderArtifact):ProviderRegistration[]{return [{token:AdminAssetsToken,plugin:AdminAssetsPlugin,declaration:AdminAssetsPlugin.declaration,configuration:{},artifact},{token:AdminPresentationToken,plugin:AdminPresentationPlugin,declaration:AdminPresentationPlugin.declaration,configuration:{},artifact},{token:AdminToken,plugin:AdminPlugin,declaration:AdminPlugin.declaration,configuration:settings,artifact}];}
 static selections(scopeId:string):Array<{scopeId:string;capability:string;providerId:string}>{return [{scopeId,capability:AdminAssetsToken.id,providerId:AdminAssetsPlugin.declaration.id},{scopeId,capability:AdminPresentationToken.id,providerId:AdminPresentationPlugin.declaration.id},{scopeId,capability:AdminToken.id,providerId:AdminPlugin.declaration.id}];}
}
export class AdminBuild {
 static metadata():NativeProviderDeclaration{return AdminPlugin.declaration;}
 static asset(file=new URL('./browser.bundle.js',import.meta.url)):{bytes:Buffer;digest:string}{const bytes=readFileSync(file);return {bytes,digest:createHash('sha256').update(bytes).digest('hex')};}
 static async run():Promise<void>{if(!import.meta.main)return;if(process.argv[2]==='--build-assets'){const result=await Bun.build({entrypoints:['src/browser.ts'],outdir:'dist/src',naming:'browser.bundle.js',target:'browser',minify:true,define:{'process.env.NODE_ENV':JSON.stringify('production')}});if(!result.success)throw new Error('Browser build failed');const metadata=JSON.parse(readFileSync('package.json','utf8')) as {name:string;version:string;cordis?:unknown;cordisAsset?:unknown;cordisPackage?:unknown};if(metadata.version!==AdminPackageIdentity.version)throw new Error('ADMIN_PACKAGE_IDENTITY_DRIFT');metadata.cordis=this.metadata();metadata.cordisAsset={path:'dist/src/browser.bundle.js',sha256:this.asset().digest};const browser=await import('./browser.js'),providers=[PackageDefinition.export(AdminPlugin,'dist/src/admin.js','AdminPlugin'),PackageDefinition.export(AdminAssetsPlugin,'dist/src/admin.js','AdminAssetsPlugin'),PackageDefinition.export(AdminPresentationPlugin,'dist/src/admin.js','AdminPresentationPlugin')];for(const plugin of [browser.AdminBrowserStatePlugin,browser.HttpStatusPlugin,browser.AdminNavigationPlugin,browser.AdminActionsPlugin,browser.StatusPagePlugin])providers.push(PackageDefinition.export(plugin,'dist/src/browser.js',plugin.name));const asset=this.asset();metadata.cordisPackage=PackageDefinition.define(metadata.name,metadata.version,'admin',providers,[{path:'dist/src/browser.bundle.js',sha256:asset.digest,size:asset.bytes.length}]);writeFileSync('package.json',JSON.stringify(metadata,null,2)+'\n');}else if(process.argv[2]==='--describe')process.stdout.write(JSON.stringify(this.metadata())+'\n');else{process.stderr.write('Unsupported admin program invocation.\n');process.exitCode=2;}}
}
await AdminBuild.run();

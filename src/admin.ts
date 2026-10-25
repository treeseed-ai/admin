import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {CapabilityToken,ProviderSchemas,InstalledTokens,InstalledSchemas,CanonicalJson,type ProviderDeclaration,type ProviderArtifact,type PlatformInvoker,type ServerConfiguration,type TrustedPrincipal} from '@treeseed-cordis/sdk';
import {Context,type ProviderRegistration} from '@treeseed-cordis/sdk/runtime';
import {IdentitySessionsToken,type IdentitySessions} from '@treeseed-cordis/identity';
export interface AdminContribution {handle(request:Request):Promise<Response|null>;assetDigest():string;}
class AdminAdapter {parse(value:unknown):AdminContribution{if(!value||typeof (value as AdminContribution).handle!=='function'||typeof (value as AdminContribution).assetDigest!=='function')throw new Error('Admin unavailable');return value as AdminContribution;}}
export const AdminToken=new CapabilityToken<AdminContribution>('admin.routes',ProviderSchemas.version,new AdminAdapter());
export class AdminRoutes implements AdminContribution {
 private readonly asset:{bytes:Buffer;digest:string};
 constructor(private readonly sessions:IdentitySessions,private readonly invoker:PlatformInvoker,private readonly settings:ServerConfiguration){this.asset=AdminBuild.asset();if(this.asset.digest!==settings.assetDigest)throw new Error('Admin asset mismatch');}
 assetDigest():string{return this.asset.digest;}
 static escape(value:string):string{return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
 static cookie(header:string,name:string):string{let result='',found=false;for(const item of header.split(';')){const index=item.indexOf('=');if(index<0||item.slice(0,index).trim()!==name)continue;if(found)return '';found=true;result=item.slice(index+1).trim();}return result;}
 private response(body:BodyInit|null,status=200,headers:Record<string,string>={}):Response{return new Response(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",...headers}});}
 private redirect(location:string,cookies:string[]):Response{const response=this.response(null,303,{Location:location});for(const cookie of cookies)response.headers.append('Set-Cookie',cookie);return response;}
 static sessionCookieName(settings:Pick<ServerConfiguration,'installationId'|'origin'>):string{return '__Host-cordis-'+CanonicalJson.digest({installationId:settings.installationId,origin:settings.origin}).slice(0,16);}
 private cookieValue(name:string,value:string,seconds:number):string{return name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+seconds;}
 async handle(request:Request):Promise<Response|null>{const url=new URL(request.url);if(url.origin!==this.settings.origin)return this.response('Origin refused',400);const path=url.pathname,header=request.headers.get('cookie')??'',sessionName=AdminRoutes.sessionCookieName(this.settings),stateName=sessionName+'-state',session=AdminRoutes.cookie(header,sessionName);
  if(path==='/assets/admin-'+this.asset.digest+'.js'&&request.method==='GET')return this.response(new Uint8Array(this.asset.bytes),200,{'Content-Type':'text/javascript; charset=utf-8'});
  if(path==='/admin/login'&&request.method==='GET'){const login=await this.sessions.login();return this.redirect(login.location,[this.cookieValue(stateName,login.state,300)]);}
  if(path==='/admin/callback'&&request.method==='GET'){try{const cookie=await this.sessions.callback(url,AdminRoutes.cookie(header,stateName));return this.redirect('/admin',[this.cookieValue(sessionName,cookie,28800),this.cookieValue(stateName,'',0)]);}catch{return this.response('Identity callback refused',401);}}
  if(!['/admin','/admin/','/admin/status','/admin/logout'].includes(path))return null;
  const principal=await this.sessions.principal(session);if(!principal||!principal.scopes.includes('platform.read'))return path==='/admin'||path==='/admin/'?this.redirect('/admin/login',[]):this.response('Authentication required',401);
  if(path==='/admin/status'&&request.method==='GET')return this.response(JSON.stringify(await this.invoker.invoke('platform.status',{},principal)),200,{'Content-Type':'application/json'});
  if(path==='/admin/logout'&&request.method==='POST'){if(request.headers.get('origin')!==this.settings.origin||Number(request.headers.get('content-length')??0)>4096)return this.response('Origin refused',403);const body=await request.text();if(body.length>4096||new URLSearchParams(body).get('csrf')!==this.csrf(session,principal))return this.response('Request refused',403);await this.sessions.logout(session);return this.redirect('/admin',[this.cookieValue(sessionName,'',0)]);}
  if((path==='/admin'||path==='/admin/')&&request.method==='GET'){const csrf=this.csrf(session,principal);return this.response('<!doctype html><html><head><meta charset="utf-8"><title>Cordis installed status</title></head><body><h1>Cordis installed status</h1><p>Installation '+AdminRoutes.escape(this.settings.installationId)+'</p><pre id="installed-status">Loading installed status…</pre><form method="post" action="/admin/logout"><input type="hidden" name="csrf" value="'+csrf+'"><button>Sign out</button></form><script type="module" src="/assets/admin-'+this.asset.digest+'.js"></script></body></html>',200,{'Content-Type':'text/html; charset=utf-8'});}
  return this.response('Method refused',405);
 }
 private csrf(session:string,principal:TrustedPrincipal):string{return CanonicalJson.digest({purpose:'logout',session,principal:principal.principalId});}
}
export class AdminPlugin {
 static readonly declaration:ProviderDeclaration=ProviderSchemas.declaration.parse({id:'installed-admin',pluginId:'admin',capability:AdminToken.id,contractVersion:ProviderSchemas.version,target:'api',provide:[AdminToken.id],inject:[IdentitySessionsToken.id,InstalledTokens.invoker.id]});
 static readonly provide=this.declaration.provide;static readonly inject=this.declaration.inject;static readonly Config=InstalledSchemas.serverConfiguration;
 constructor(context:Context,settings:ServerConfiguration){context.provide(AdminToken.id,new AdminRoutes(IdentitySessionsToken.parse(Reflect.get(context,IdentitySessionsToken.id)),InstalledTokens.invoker.parse(Reflect.get(context,InstalledTokens.invoker.id)),settings));}
}
export class AdminComposition {
 static registrations(settings:ServerConfiguration,artifact:ProviderArtifact):ProviderRegistration[]{return [{token:AdminToken,plugin:AdminPlugin,declaration:AdminPlugin.declaration,configuration:settings,artifact}];}
 static selections(scopeId:string):Array<{scopeId:string;capability:string;providerId:string}>{return [{scopeId,capability:AdminToken.id,providerId:AdminPlugin.declaration.id}];}
}
export class AdminBuild {
 static metadata():ProviderDeclaration{return AdminPlugin.declaration;}
 static asset(file=new URL('./browser.bundle.js',import.meta.url)):{bytes:Buffer;digest:string}{const bytes=readFileSync(file);return {bytes,digest:createHash('sha256').update(bytes).digest('hex')};}
 static async run():Promise<void>{if(!import.meta.main)return;if(process.argv[2]==='--build-assets'){const result=await Bun.build({entrypoints:['src/browser.ts'],outdir:'dist/src',naming:'browser.bundle.js',target:'browser',minify:true});if(!result.success)throw new Error('Browser build failed');const metadata=JSON.parse(readFileSync('package.json','utf8')) as Record<string,unknown>;metadata.cordis=this.metadata();metadata.cordisAsset={path:"dist/src/browser.bundle.js",sha256:this.asset().digest};writeFileSync('package.json',JSON.stringify(metadata,null,2)+'\n');}else if(process.argv[2]==='--describe')process.stdout.write(JSON.stringify(this.metadata())+'\n');else{process.stderr.write('Unsupported admin program invocation.\n');process.exitCode=2;}}
}
await AdminBuild.run();

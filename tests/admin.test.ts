import {test,expect} from 'bun:test';
import {spawnSync} from 'node:child_process';
import {AdminBuild,AdminRoutes,AdminAssetCatalog} from '../src/admin.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {AdminViews} from '../src/views.js';
import {PlatformOperations} from '@treeseed-cordis/sdk';
import {UiSourcePolicy} from '@treeseed-cordis/ui/source-policy';
class AdminTests {
 status():void{const view=AdminViews.initial('fixture','a'.repeat(64)),status=PlatformOperations.status.parseOutput({installationId:'fixture',engine:'default',desiredComposition:null,activeComposition:null,ready:false,plugins:[],blockers:[],applicationId:null});expect(AdminViews.refreshed(view,status).componentId).toBe('stack');expect(AdminViews.refreshed.bind(AdminViews,view,{success:true,result:status})).toThrow();expect(AdminViews.refreshed.bind(AdminViews,view,{ready:true})).toThrow();}
 assets():void{const catalog=new AdminAssetCatalog();expect(catalog.digest()).toMatch(/^[a-f0-9]{64}$/);const script=catalog.script(),asset=catalog.asset(script.path)!;expect(asset.sha256).toBe(script.sha256);asset.bytes[0]=0;expect(catalog.asset(script.path)!.bytes[0]).not.toBe(0);expect(catalog.asset('/assets/../../private')).toBeNull();const resolve=createRequire(import.meta.url),root=join(dirname(resolve.resolve('@treeseed-cordis/ui/contracts')),'../..'),metadata=JSON.parse(readFileSync(join(root,'package.json'),'utf8')),file=join(root,metadata.cordisPackage.assets[0].path),bytes=readFileSync(file);try{writeFileSync(file,Buffer.concat([bytes,Buffer.from('tamper')]));expect(AdminTests.newCatalog).toThrow('ASSET_BYTES_MISMATCH');}finally{writeFileSync(file,bytes);}}
 static newCatalog():void{new AdminAssetCatalog();}
 policy():void{const policy=new UiSourcePolicy();expect(policy.inspect('src/copied.ts','class Copied {render(){return "<button>Sign out</button>";}}').length).toBeGreaterThan(0);expect(policy.inspect('src/copied.ts','class Copied {render(){document.body.textContent="status";}}').length).toBeGreaterThan(0);expect(policy.inspect('src/adapter.ts','class Adapter {read(){return {componentId:"status",model:{state:"Ready"}};}}')).toEqual([]);}

 nodeAssets():void{const code="import {AdminAssetCatalog} from './dist/src/admin.js'; class Program { static run(){const catalog=new AdminAssetCatalog(),script=catalog.script();if(!/^[a-f0-9]{64}$/.test(catalog.digest())||catalog.asset(script.path)?.sha256!==script.sha256)throw new Error('INVALID_DEFAULT_ASSETS');process.stdout.write('node-assets-ok\\n');}} Program.run();";const result=spawnSync('node',['--input-type=module','-e',code],{encoding:'utf8'});expect(result.stderr).toBe('');expect(result.status).toBe(0);expect(result.stdout).toBe('node-assets-ok\n');}
 program():void{const result=spawnSync('node',['dist/src/admin.js','--describe'],{encoding:'utf8'});expect(result.status).toBe(0);expect(result.stderr).toBe('');expect(JSON.parse(result.stdout).capability).toBe('admin.routes');}
 cookies():void{expect(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8443'})).not.toBe(AdminRoutes.sessionCookieName({installationId:'two',origin:'https://localhost:8443'}));expect(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8443'})).not.toBe(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8444'}));expect(AdminRoutes.cookie('other=x; __Host-cordis=value','__Host-cordis')).toBe('value');expect(AdminRoutes.cookie('__Host-cordis=a; __Host-cordis=b','__Host-cordis')).toBe('');}
 browser():void{const asset=AdminBuild.asset(new URL('../dist/src/browser.bundle.js',import.meta.url));expect(asset.bytes.length).toBeGreaterThan(100);expect(asset.digest).toMatch(/^[a-f0-9]{64}$/);expect(asset.bytes.toString().includes('CANARY_PRIVATE_OIDC')).toBe(false);expect(/(?:from\s*|require\()['"]node:/.test(asset.bytes.toString())).toBe(false);expect(JSON.parse(readFileSync('package.json','utf8')).cordis).toEqual(AdminBuild.metadata());}
}
const suite=new AdminTests();test('smoke: built admin contribution declares native route capability',suite.program.bind(suite));test('unit: cookie ambiguity and installation separation fail safely',suite.cookies.bind(suite));test('integration: browser-only asset and native metadata are generated',suite.browser.bind(suite));

test('integration: installed public assets are verified and immutable',suite.assets.bind(suite));test('unit: consumer presentation gate rejects copied rendering',suite.policy.bind(suite));

test('smoke: built Node default asset catalog traverses genuine package module boundaries',suite.nodeAssets.bind(suite));

test('unit: Admin maps genuine SDK status outputs and refuses envelopes or malformed status',suite.status.bind(suite));

import {test,expect} from 'bun:test';
import {spawnSync} from 'node:child_process';
import {AdminBuild,AdminRoutes,AdminAssetCatalog} from '../../src/admin.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {AdminViews} from '../../src/views.js';
import {PlatformOperations} from '@treeseed-cordis/sdk';
import {UiSourcePolicy} from '@treeseed-cordis/ui/source-policy';
import {AdminTests} from '../support/admin-test-support.js';
class AdminTestsIntegration extends AdminTests {

 assets():void{const catalog=new AdminAssetCatalog();expect(catalog.digest()).toMatch(/^[a-f0-9]{64}$/);const script=catalog.script(),asset=catalog.asset(script.path)!;expect(asset.sha256).toBe(script.sha256);asset.bytes[0]=0;expect(catalog.asset(script.path)!.bytes[0]).not.toBe(0);expect(catalog.asset('/assets/../../private')).toBeNull();const resolve=createRequire(import.meta.url),root=join(dirname(resolve.resolve('@treeseed-cordis/ui/contracts')),'../..'),metadata=JSON.parse(readFileSync(join(root,'package.json'),'utf8')),file=join(root,metadata.cordisPackage.assets[0].path),bytes=readFileSync(file);try{writeFileSync(file,Buffer.concat([bytes,Buffer.from('tamper')]));expect(AdminTests.newCatalog).toThrow('ASSET_BYTES_MISMATCH');}finally{writeFileSync(file,bytes);}}

 browser():void{const asset=AdminBuild.asset(new URL('../../dist/src/browser.bundle.js',import.meta.url));expect(asset.bytes.length).toBeGreaterThan(100);expect(asset.digest).toMatch(/^[a-f0-9]{64}$/);expect(asset.bytes.toString().includes('CANARY_PRIVATE_OIDC')).toBe(false);expect(/(?:from\s*|require\()['"]node:/.test(asset.bytes.toString())).toBe(false);expect(JSON.parse(readFileSync('package.json','utf8')).cordis).toEqual(AdminBuild.metadata());}
}
const suite=new AdminTestsIntegration();
test('integration: browser-only asset and native metadata are generated',suite.browser.bind(suite));
test('integration: installed public assets are verified and immutable',suite.assets.bind(suite));

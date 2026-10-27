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
class AdminTestsUnit extends AdminTests {

 status():void{const view=AdminViews.initial('fixture','a'.repeat(64)),status=PlatformOperations.status.parseOutput({installationId:'fixture',engine:'default',desiredComposition:null,activeComposition:null,ready:false,plugins:[],blockers:[],applicationId:null});expect(AdminViews.refreshed(view,status).componentId).toBe('stack');expect(AdminViews.refreshed.bind(AdminViews,view,{success:true,result:status})).toThrow();expect(AdminViews.refreshed.bind(AdminViews,view,{ready:true})).toThrow();}

 policy():void{const policy=new UiSourcePolicy();expect(policy.inspect('src/copied.ts','class Copied {render(){return "<button>Sign out</button>";}}').length).toBeGreaterThan(0);expect(policy.inspect('src/copied.ts','class Copied {render(){document.body.textContent="status";}}').length).toBeGreaterThan(0);expect(policy.inspect('src/adapter.ts','class Adapter {read(){return {componentId:"status",model:{state:"Ready"}};}}')).toEqual([]);}

 cookies():void{expect(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8443'})).not.toBe(AdminRoutes.sessionCookieName({installationId:'two',origin:'https://localhost:8443'}));expect(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8443'})).not.toBe(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8444'}));expect(AdminRoutes.cookie('other=x; __Host-cordis=value','__Host-cordis')).toBe('value');expect(AdminRoutes.cookie('__Host-cordis=a; __Host-cordis=b','__Host-cordis')).toBe('');}
}
const suite=new AdminTestsUnit();
test('unit: cookie ambiguity and installation separation fail safely',suite.cookies.bind(suite));
test('unit: consumer presentation gate rejects copied rendering',suite.policy.bind(suite));
test('unit: Admin maps genuine SDK status outputs and refuses envelopes or malformed status',suite.status.bind(suite));

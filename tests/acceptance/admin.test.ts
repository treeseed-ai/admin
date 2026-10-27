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
class AdminTestsAcceptance extends AdminTests {


 nodeAssets():void{const code="import {AdminAssetCatalog} from './dist/src/admin.js'; class Program { static run(){const catalog=new AdminAssetCatalog(),script=catalog.script();if(!/^[a-f0-9]{64}$/.test(catalog.digest())||catalog.asset(script.path)?.sha256!==script.sha256)throw new Error('INVALID_DEFAULT_ASSETS');process.stdout.write('node-assets-ok\\n');}} Program.run();";const result=spawnSync('node',['--input-type=module','-e',code],{encoding:'utf8'});expect(result.stderr).toBe('');expect(result.status).toBe(0);expect(result.stdout).toBe('node-assets-ok\n');}

 program():void{const result=spawnSync('node',['dist/src/admin.js','--describe'],{encoding:'utf8'});expect(result.status).toBe(0);expect(result.stderr).toBe('');expect(JSON.parse(result.stdout).capability).toBe('admin.routes');}
}
const suite=new AdminTestsAcceptance();
test("acceptance: built admin contribution declares native route capability",suite.program.bind(suite));
test("acceptance: built Node default asset catalog traverses genuine package module boundaries",suite.nodeAssets.bind(suite));

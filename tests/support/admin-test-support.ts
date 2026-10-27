import {test,expect} from 'bun:test';
import {spawnSync} from 'node:child_process';
import {AdminBuild,AdminRoutes,AdminAssetCatalog} from '../../src/admin.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {AdminViews} from '../../src/views.js';
import {PlatformOperations} from '@treeseed-cordis/sdk';
import {UiSourcePolicy} from '@treeseed-cordis/ui/source-policy';
export class AdminTests {
 static newCatalog():void{new AdminAssetCatalog();}
}

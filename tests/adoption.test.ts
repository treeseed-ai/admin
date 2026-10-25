import { test, expect } from 'bun:test';
import { spawnSync } from 'node:child_process';
class AdoptionTests {
    program(): void {
        const code = "import {readFileSync,existsSync,realpathSync} from 'node:fs';import {createRequire} from 'node:module';import {dirname,join} from 'node:path';import {createHash} from 'node:crypto';import {IdentityBuild} from '@treeseed-cordis/identity';class Program{static run(){const own=JSON.parse(readFileSync('package.json','utf8')),require=createRequire(import.meta.url);for(const owner of ['sdk','identity','ui']){let directory=dirname(realpathSync(require.resolve('@treeseed-cordis/'+owner)));while(!existsSync(join(directory,'package.json'))){const parent=dirname(directory);if(parent===directory)throw new Error('Missing installed package');directory=parent;}const installed=JSON.parse(readFileSync(join(directory,'package.json'),'utf8'));if(installed.version!==own.peerDependencies['@treeseed-cordis/'+owner]||createHash('sha256').update(readFileSync('vendor/'+owner+'.tgz')).digest('hex')!==own.cordisCandidate[owner].sha256)throw new Error('Installed owner adoption mismatch');}if(IdentityBuild.package().package.version!==own.peerDependencies['@treeseed-cordis/identity'])throw new Error('Native owner projection mismatch');process.stdout.write('owner-adoption-ok\\n');}}Program.run();";
        const result = spawnSync('node', ['--input-type=module', '-e', code], { encoding: 'utf8' }); expect(result.status).toBe(0); expect(result.stderr).toBe(''); expect(result.stdout).toBe('owner-adoption-ok\n');
    }
}
const adoption = new AdoptionTests();
test('smoke: installed native owner identities match exact peer selections and vendored archive pins', adoption.program.bind(adoption));

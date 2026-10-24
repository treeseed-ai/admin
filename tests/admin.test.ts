import {test,expect} from 'bun:test';
import {spawnSync} from 'node:child_process';
import {AdminBuild,AdminRoutes} from '../src/admin.js';
import {readFileSync} from 'node:fs';
class AdminTests {
 program():void{const result=spawnSync('node',['dist/src/admin.js','--describe'],{encoding:'utf8'});expect(result.status).toBe(0);expect(result.stderr).toBe('');expect(JSON.parse(result.stdout).capability).toBe('admin.routes');}
 cookies():void{expect(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8443'})).not.toBe(AdminRoutes.sessionCookieName({installationId:'two',origin:'https://localhost:8443'}));expect(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8443'})).not.toBe(AdminRoutes.sessionCookieName({installationId:'one',origin:'https://localhost:8444'}));expect(AdminRoutes.cookie('other=x; __Host-cordis=value','__Host-cordis')).toBe('value');expect(AdminRoutes.cookie('__Host-cordis=a; __Host-cordis=b','__Host-cordis')).toBe('');expect(AdminRoutes.escape('<script>"&')).toBe('&lt;script&gt;&quot;&amp;');}
 browser():void{const asset=AdminBuild.asset(new URL('../dist/src/browser.bundle.js',import.meta.url));expect(asset.bytes.length).toBeGreaterThan(100);expect(asset.digest).toMatch(/^[a-f0-9]{64}$/);expect(asset.bytes.toString()).not.toContain('clientSecret');expect(asset.bytes.toString()).not.toContain('node:');expect(JSON.parse(readFileSync('package.json','utf8')).cordis).toEqual(AdminBuild.metadata());}
}
const suite=new AdminTests();test('smoke: built admin contribution declares native route capability',suite.program.bind(suite));test('unit: cookie ambiguity and markup injection fail safely',suite.cookies.bind(suite));test('integration: browser-only asset and native metadata are generated',suite.browser.bind(suite));

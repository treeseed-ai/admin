import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as sdk from '@treeseed-cordis/sdk';
import { AdminBuild } from '../../src/admin.js';

interface Selection { version: string; commit: string; sha256: string; }
class OwnerCompatibilityProgram {
  private static readonly selections: Record<string, Selection> = {
    sdk: { version: '0.0.0-cordis.19', commit: '90cf4f3cc62e166685280450c727499defd2af5b',
      sha256: '93dd549c98aba180306e9b19cc1cbc37494544b2764ed341c531c9af618c6f81' },
    identity: { version: '0.0.0-cordis.8', commit: 'cb86258e93337559aa4a248177a20bd2a07fd467',
      sha256: 'a308c71b0da1822e7786121092a05f2496d26614942aaeb459a78531e689cb76' },
    ui: { version: '0.0.0-cordis.18', commit: 'e2b9c5e10611c196834fd57ba5358a74304e373c',
      sha256: 'd09e6ed33f7f1bc2f7210208a94f33bbd2a6453d8fe886f75a1f950887223e48' },
  };
  run(): void {
    for (const [owner, selection] of Object.entries(OwnerCompatibilityProgram.selections))
      this.selection(owner, selection);
    assert.equal(typeof Reflect.get(sdk, 'CapacitySchemas'), 'function');
    assert.equal(sdk.PlatformOperations.all.length, 7);
    assert.equal(AdminBuild.metadata().capability, 'admin.routes');
    process.stdout.write('admin-capacity-contracts-ok\n');
  }
  private selection(owner: string, selection: Selection): void {
    const metadata = JSON.parse(readFileSync('package.json', 'utf8'));
    const digest = createHash('sha256').update(readFileSync('vendor/' + owner + '.tgz')).digest('hex');
    assert.equal(metadata.peerDependencies['@treeseed-cordis/' + owner], selection.version);
    assert.equal(metadata.cordisCandidate[owner].commit, selection.commit);
    assert.equal(metadata.cordisCandidate[owner].sha256, selection.sha256);
    assert.equal(digest, selection.sha256);
  }
}
if (import.meta.main) new OwnerCompatibilityProgram().run();

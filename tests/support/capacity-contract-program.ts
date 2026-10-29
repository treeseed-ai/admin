import assert from 'node:assert/strict';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as sdk from '@treeseed-cordis/sdk';
import { IdentityBuild } from '@treeseed-cordis/identity';
import { AdminBuild } from '../../src/admin.js';

interface Selection {
  version: string;
  commit: string;
  sha256: string;
}
class OwnerCompatibilityProgram {
  private static readonly entries: Record<string, string> = {
    sdk: createRequire(import.meta.url).resolve('@treeseed-cordis/sdk'),
    identity: createRequire(import.meta.url).resolve('@treeseed-cordis/identity'),
    ui: createRequire(import.meta.url).resolve('@treeseed-cordis/ui'),
  };
  private static readonly selections: Record<string, Selection> = {
    sdk: {
      version: '0.0.0-cordis.42',
      commit: 'afdfac7bdd3c9c1f783362cd1d50324181e1d725',
      sha256: '0ecfe599916fe8ef364fc4b73203c810981f163109fbe71a0dd4c01a9dfb7bbc',
    },
    identity: {
      version: '0.0.0-cordis.9',
      commit: 'c60dfdbc53ce78ddee3c2f18ec7f91358878d49c',
      sha256: '2999a78da5c04f6a894c643d49ab3881ff702fb4325d74fec469a4496f034c67',
    },
    ui: {
      version: '0.0.0-cordis.23',
      commit: 'd5d33c33791fe8b94aada605dba4aa9392559637',
      sha256: '7291d35fe8758fd27b23f663dcf1f254bd915b5ae3569dde8c9a2f443e45a14f',
    },
  };
  run(): void {
    for (const [owner, selection] of Object.entries(OwnerCompatibilityProgram.selections))
      this.selection(owner, selection);
    assert.equal(typeof Reflect.get(sdk, 'CapacitySchemas'), 'function');
    const channel = Reflect.get(sdk, 'CapacityChannelSchemas');
    assert.equal(typeof channel, 'function');
    assert.equal(Reflect.get(channel, 'version'), '1.1.0-cordis.1');
    assert.equal(sdk.PlatformOperations.all.length, 7);
    assert.equal(AdminBuild.metadata().capability, 'admin.routes');
    assert.equal(IdentityBuild.package().package.version, '0.0.0-cordis.9');
    process.stdout.write('owner-adoption-ok\n');
  }
  private selection(owner: string, selection: Selection): void {
    const metadata = JSON.parse(readFileSync('package.json', 'utf8'));
    const digest = createHash('sha256')
      .update(readFileSync('vendor/' + owner + '.tgz'))
      .digest('hex');
    assert.equal(metadata.peerDependencies['@treeseed-cordis/' + owner], selection.version);
    assert.equal(metadata.cordisCandidate[owner].commit, selection.commit);
    assert.equal(metadata.cordisCandidate[owner].sha256, selection.sha256);
    assert.equal(digest, selection.sha256);
    assert.equal(this.installed(owner), selection.version);
  }
  private installed(owner: string): string {
    const name = '@treeseed-cordis/' + owner;
    let directory = dirname(realpathSync(OwnerCompatibilityProgram.entries[owner]!));
    while (true) {
      const file = join(directory, 'package.json');
      if (existsSync(file)) {
        const metadata = JSON.parse(readFileSync(file, 'utf8'));
        if (metadata.name === name) return metadata.version;
      }
      const parent = dirname(directory);
      assert.notEqual(parent, directory, 'Missing installed package');
      directory = parent;
    }
  }
}
if (import.meta.main) new OwnerCompatibilityProgram().run();

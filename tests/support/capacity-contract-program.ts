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
      version: '0.0.0-cordis.44',
      commit: '00be028b92998f8d7039a3906e784c6b8598e730',
      sha256: 'd95c54cf6081c7634498dfb4f3235d42d65b8664a5d62cc87c4dd4e85381f0f3',
    },
    identity: {
      version: '0.0.0-cordis.10',
      commit: '1ed37c2384ceb23fba8b0a96ca9abe208a2cb2e5',
      sha256: '3e2e4bd25c21a4be99e927a5431f474be3903fbd509cc617adaf6c4c83183600',
    },
    ui: {
      version: '0.0.0-cordis.24',
      commit: 'b4a1490c5b06ba49b4f3408391b236be2400553a',
      sha256: 'ad7be6878932ac76a0b8d81622dd826a5152062185852bf40dc0c6c63d41c4e1',
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
    assert.equal(IdentityBuild.package().package.version, '0.0.0-cordis.10');
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

import { createHash } from 'node:crypto';
import { componentReleaseSchema, deploymentDigest } from '@treeseed/sdk/deployment';
import { expect, it } from 'vitest';
import { reissueAdminComponent } from '../../../scripts/release/reissue-component.ts';

function fixture() {
  const digest = `sha256:${'a'.repeat(64)}`;
  const runtime = { schemaVersion: 'treeseed.package-runtime/v1', componentId: 'admin', version: '0.12.59~rc35-1',
    compose: { projectName: 'treeseed-admin', files: [{ path: 'compose.yml', digest }] },
    services: [{ id: 'admin', composeService: 'admin', endpoints: [] }], stateVolumes: [],
    migrations: [], requiredCapabilities: ['docker-compose'], dependencies: [] };
  return componentReleaseSchema.parse({ schemaVersion: 'treeseed.component-release/v1', componentId: 'admin',
    release: '0.12.59~rc35-1', applicationVersion: '0.12.59-rc.35', revision: 1, track: 'development',
    source: { repository: 'treeseed-ai/admin', commit: 'a'.repeat(40) },
    stableBase: { releaseRange: '>=0.12.0 <0.14.0', compatibilityId: 'treeseed-linux-amd64-v1', catalogDigest: null },
    packages: [{ name: 'treeseed-component-admin', version: '0.12.59~rc35-1', architecture: 'all', origin: 'TreeSeed Deployment', order: 25 }],
    images: [{ role: 'admin', repository: 'treeseed/admin', digest, platforms: ['linux/amd64'], consumers: ['admin'] }],
    runtime, runtimeDigest: deploymentDigest(runtime), rollback: { compatible: true, requiresBackup: false },
    evidence: { provenance: [], sboms: [], vulnerabilities: [] } });
}
function encoded(value = fixture()) {
  const bytes = Buffer.from(JSON.stringify(value));
  return { bytes, checksum: createHash('sha256').update(bytes).digest('hex') };
}
it('repairs only packaging identity, preserving exact image, source and runtime behavior', () => {
  const original = fixture(), { bytes, checksum } = encoded(original);
  const next = reissueAdminComponent(bytes, checksum, 2);
  expect(next.release).toBe('0.12.59~rc35-2');
  expect(next.runtimeDigest).toBe(deploymentDigest(next.runtime));
  expect({ ...next, release: original.release, revision: original.revision, runtimeDigest: original.runtimeDigest,
    runtime: { ...next.runtime, version: original.runtime.version }, packages: original.packages }).toEqual(original);
});
it('requires the exact original artifact and next revision', () => {
  const { bytes, checksum } = encoded();
  expect(() => reissueAdminComponent(bytes, 'b'.repeat(64), 2)).toThrow('checksum');
  for (const revision of [1, 3, 2.5]) expect(() => reissueAdminComponent(bytes, checksum, revision)).toThrow('revision');
});
it('rejects already valid manifests, foreign sources and production', () => {
  const valid = fixture(); valid.runtimeDigest = deploymentDigest(valid.runtime);
  const input = encoded(valid);
  expect(() => reissueAdminComponent(input.bytes, input.checksum, 2)).toThrow('already valid');
  const foreign = fixture(); foreign.source.repository = 'treeseed-ai/other';
  const other = encoded(foreign);
  expect(() => reissueAdminComponent(other.bytes, other.checksum, 2)).toThrow();
  const production = fixture(); production.track = 'stable'; production.stableBase = null;
  const stable = encoded(production);
  expect(() => reissueAdminComponent(stable.bytes, stable.checksum, 2)).toThrow();
});

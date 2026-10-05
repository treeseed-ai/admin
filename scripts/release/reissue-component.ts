import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { componentReleaseSchema, deploymentDigest } from '@treeseed/sdk/deployment';

/** A packaging-only revision, never an application/image rebuild or an edit to
 * an existing asset. The caller pins the original published artifact bytes. */
export function reissueAdminComponent(bytes: Buffer, sha256: string, revision: number) {
  if (bytes.length > 4_194_304 || !/^[a-f0-9]{64}$/u.test(sha256)
    || createHash('sha256').update(bytes).digest('hex') !== sha256) throw new Error('Published component checksum mismatch');
  const original = componentReleaseSchema.parse(JSON.parse(bytes.toString('utf8')));
  if (original.componentId !== 'admin' || original.source.repository !== 'treeseed-ai/admin'
    || original.track !== 'development' || !/^\d+\.\d+\.\d+-rc\.\d+$/u.test(original.applicationVersion)
    || !Number.isSafeInteger(revision) || revision !== original.revision + 1
    || original.packages.length !== 1 || original.packages[0]!.name !== 'treeseed-component-admin'
    || original.release !== `${original.applicationVersion.replace('-rc.', '~rc')}-${original.revision}`
    || original.runtime.version !== original.release || original.packages[0]!.version !== original.release)
    throw new Error('Exact development Admin packaging revision required');
  if (deploymentDigest(original.runtime) === original.runtimeDigest) throw new Error('Component runtime integrity already valid');
  const release = `${original.applicationVersion.replace('-rc.', '~rc')}-${revision}`;
  const runtime = { ...original.runtime, version: release };
  return componentReleaseSchema.parse({ ...original, release, revision, runtime,
    runtimeDigest: deploymentDigest(runtime), packages: original.packages.map(item => ({ ...item, version: release })) });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [input, digest, revision, output] = process.argv.slice(2);
  if (!input || !digest || !revision || !output) throw new Error('Input artifact, SHA256, next revision and output required');
  const component = reissueAdminComponent(readFileSync(input), digest, Number(revision));
  writeFileSync(output, `${JSON.stringify(component, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ componentId: component.componentId, release: component.release, runtimeDigest: component.runtimeDigest }));
}

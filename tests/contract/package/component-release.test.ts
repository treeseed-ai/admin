import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { componentReleaseSchema, deploymentDigest } from '@treeseed/sdk/deployment';
import { parse } from 'yaml';

it('publishes a digest of the emitted schema-normalized component runtime', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'treeseed-component-proof-'));
  try {
    mkdirSync(resolve(root, 'deploy'));
    copyFileSync(resolve('deploy/compose.template.yml'), resolve(root, 'deploy/compose.template.yml'));
    const digest = `sha256:${'a'.repeat(64)}`;
    execFileSync(process.execPath, ['--import', resolve('node_modules/tsx/dist/loader.mjs'),
      resolve('scripts/create-component-release.ts')], {
      cwd: root, stdio: 'pipe',
      env: { PATH: process.env.PATH, TREESEED_RELEASE: '0.13.0-rc.1',
        TREESEED_SOURCE_COMMIT: 'a'.repeat(40), TREESEED_ADMIN_DIGEST: digest,
        TREESEED_MANAGER_DIGEST: digest, TREESEED_RUNNER_DIGEST: digest,
        TREESEED_SANDBOX_BASE_DIGEST: digest, TREESEED_GUEST_DIGEST: digest },
    });
    const raw = JSON.parse(readFileSync(resolve(root, 'release-assets/component-release.json'), 'utf8'));
    const parsed = componentReleaseSchema.parse(raw);
    expect(raw.runtimeDigest).toBe(deploymentDigest(raw.runtime));
    expect(parsed.runtimeDigest).toBe(deploymentDigest(parsed.runtime));
    expect(componentReleaseSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed);
    expect(parsed.runtime.configuration).toBeDefined();
    expect(parsed.runtime.configuration.secretEnvironment).toContainEqual({ name: 'TREESEED_IDENTITY_WORKLOAD_PRIVATE_KEY', required: true });
    const compose = parse(readFileSync(resolve(root, 'release-assets/compose.yml'), 'utf8'));
    expect(compose.services.admin.env_file).toBe('/etc/treeseed/components/admin/environment');
    expect(compose.services.admin.environment.NODE_EXTRA_CA_CERTS).toBe('/run/treeseed/identity/ca.crt');
    expect(compose.services.admin.environment.TREESEED_IDENTITY_WORKLOAD_PRIVATE_KEY).toBeUndefined();
    expect(compose.services.admin.volumes).toContainEqual({ type: 'bind', source: '/etc/treeseed/cli/localhost-ca.crt',
      target: '/run/treeseed/identity/ca.crt', read_only: true });
  } finally { rmSync(root, { recursive: true, force: true }); }
});

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { componentReleaseSchema, deploymentDigest } from '@treeseed/sdk/deployment';

const release = process.env.TREESEED_RELEASE, sourceCommit = process.env.TREESEED_SOURCE_COMMIT;
const adminDigest = process.env.TREESEED_ADMIN_DIGEST;
if (!release || !sourceCommit || !adminDigest) throw new Error('Release, exact source commit, and multi-architecture image digest are required.');
if (!/^[a-f0-9]{40}$/u.test(sourceCommit) || !/^sha256:[a-f0-9]{64}$/u.test(adminDigest)) throw new Error('Source or image digest is malformed.');
const track = release.includes('-rc.') ? 'development' : 'stable';
const revision = Number(process.env.TREESEED_COMPONENT_REVISION ?? '1');
const debianRelease = `${release.replace(/-rc\.(\d+)$/u, '~rc$1')}-${revision}`;
const compose = readFileSync(resolve('deploy/compose.template.yml'), 'utf8').replace('@ADMIN_IMAGE@', `treeseed/admin@${adminDigest}`);
if (/\bbuild\s*:/u.test(compose) || /@ADMIN_IMAGE@/u.test(compose)) throw new Error('Production Compose bundle is not fully materialized.');
const composeDigest = `sha256:${createHash('sha256').update(compose).digest('hex')}`;
const runtime = {
	schemaVersion: 'treeseed.package-runtime/v1' as const, componentId: 'admin', version: debianRelease,
	compose: { projectName: 'treeseed-admin', files: [{ path: 'compose.yml', digest: composeDigest }] },
	services: [{ id: 'admin', composeService: 'admin', endpoints: [{ id: 'http', protocol: 'http' as const, port: 4322,
		visibility: 'host' as const, defaultAlias: 'admin.treeseed.localhost', aliasOverride: false, tls: 'edge' as const,
		authentication: 'application' as const, healthGate: { protocol: 'http' as const, path: '/healthz', timeoutSeconds: 120 } }] }],
	stateVolumes: [], migrations: [], requiredCapabilities: ['docker-compose'],
	dependencies: [{ id: 'api', capability: 'control-plane-api', locality: 'either' as const, optional: false }],
};
const tagUrl = `https://hub.docker.com/r/treeseed/admin/tags?name=${encodeURIComponent(release)}`;
const bundle = componentReleaseSchema.parse({
	schemaVersion: 'treeseed.component-release/v1', componentId: 'admin', release: debianRelease, applicationVersion: release,
	revision, track, source: { repository: 'treeseed-ai/admin', commit: sourceCommit },
	stableBase: track === 'development' ? { releaseRange: '>=0.12.0 <0.14.0', compatibilityId: 'treeseed-linux-amd64-v1', catalogDigest: null } : null,
	packages: [{ name: 'treeseed-component-admin', version: debianRelease, architecture: 'all', origin: 'TreeSeed Deployment', order: 25 }],
	images: [{ role: 'admin', repository: 'treeseed/admin', digest: adminDigest, platforms: ['linux/amd64', 'linux/arm64'], consumers: ['admin'] }],
	runtime, runtimeDigest: deploymentDigest(runtime), rollback: { compatible: true, requiresBackup: false },
	evidence: { provenance: [tagUrl], sboms: [tagUrl], vulnerabilities: [] },
});
const output = resolve('release-assets'); mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, 'compose.yml'), compose);
writeFileSync(resolve(output, 'component-release.json'), `${JSON.stringify(bundle, null, 2)}\n`);

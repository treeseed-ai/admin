#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, extname, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { parse } from 'yaml';

const packageRoot = resolve(new URL('..', import.meta.url).pathname);
const requireFromPackage = createRequire(resolve(packageRoot, 'package.json'));
const srcRoot = resolve(packageRoot, 'src');
const liveDistRoot = resolve(packageRoot, 'dist');
const buildRoot = resolve(packageRoot, '.local', 'build-dist', String(process.pid));
const distRoot = resolve(buildRoot, 'dist');
const buildLockRoot = resolve(packageRoot, '.treeseed-build-dist.lock');

const COMPILE_EXTENSIONS = new Set(['.ts', '.tsx']);
const COPY_EXTENSIONS = new Set(['.astro', '.css', '.d.ts', '.js', '.json', '.yaml', '.yml']);
const BUILD_LOCK_TIMEOUT_MS = 15 * 60 * 1000;
const BUILD_LOCK_STALE_MS = 20 * 60 * 1000;

function sleep(ms) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function lockOwnerIsRunning() {
	let owner;
	try {
		owner = JSON.parse(readFileSync(resolve(buildLockRoot, 'owner.json'), 'utf8'));
	} catch {
		return false;
	}

	if (typeof owner?.pid !== 'number') {
		return false;
	}

	try {
		process.kill(owner.pid, 0);
		return true;
	} catch (error) {
		const code = typeof error === 'object' && error && 'code' in error ? error.code : null;
		return code === 'EPERM';
	}
}

async function acquireBuildLock() {
	const startedAt = Date.now();
	while (true) {
		try {
			mkdirSync(buildLockRoot);
			writeFileSync(resolve(buildLockRoot, 'owner.json'), JSON.stringify({
				pid: process.pid,
				startedAt: new Date().toISOString(),
			}, null, 2));
			return () => rmSync(buildLockRoot, { recursive: true, force: true });
		} catch {
			const ageMs = existsSync(buildLockRoot) ? Date.now() - statSync(buildLockRoot).mtimeMs : 0;
			if (!lockOwnerIsRunning() || ageMs > BUILD_LOCK_STALE_MS) {
				rmSync(buildLockRoot, { recursive: true, force: true });
				continue;
			}
			if (Date.now() - startedAt > BUILD_LOCK_TIMEOUT_MS) {
				throw new Error(`Timed out waiting for Admin dist build lock at ${buildLockRoot}.`);
			}
			await sleep(250);
		}
	}
}

function walkFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function rewriteRuntimeSpecifiers(source) {
  return source
    .replace(/(['"`])(\.{1,2}\/[^'"`\n]+)\.tsx\1/g, '$1$2.js$1')
    .replace(/(['"`])(\.{1,2}\/[^'"`\n]+)\.ts\1/g, '$1$2.js$1');
}

async function compileModule(filePath) {
  const relativePath = relative(srcRoot, filePath);
  const outputFile = resolve(distRoot, relativePath.replace(/\.(ts|tsx)$/u, '.js'));
  ensureDir(outputFile);
  await build({
    entryPoints: [filePath],
    outfile: outputFile,
    platform: 'neutral',
    format: 'esm',
    bundle: false,
    logLevel: 'silent',
    jsx: 'automatic',
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
    },
  });
  writeFileSync(outputFile, rewriteRuntimeSpecifiers(readFileSync(outputFile, 'utf8')), 'utf8');
}

function copyAsset(filePath) {
  const outputFile = resolve(distRoot, relative(srcRoot, filePath));
  ensureDir(outputFile);
  cpSync(filePath, outputFile);
  if (outputFile.endsWith('.astro') || outputFile.endsWith('.js') || outputFile.endsWith('.d.ts')) {
    writeFileSync(outputFile, rewriteRuntimeSpecifiers(readFileSync(outputFile, 'utf8')), 'utf8');
  }
}

function writeDeclaration(relativePath, source) {
  const filePath = resolve(distRoot, relativePath);
  ensureDir(filePath);
  writeFileSync(filePath, source, 'utf8');
}

function canonicalize(value) {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (!value || typeof value !== 'object') return value;
	return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function writeGuaranteeCatalog() {
	const guaranteesRoot = resolve(packageRoot, 'guarantees');
	const guarantees = walkFiles(guaranteesRoot)
		.filter((path) => /\.guarantee\.ya?ml$/u.test(path))
		.map((path) => ({ sourcePath: relative(packageRoot, path).replaceAll('\\', '/'), manifest: parse(readFileSync(path, 'utf8')) }))
		.sort((a, b) => String(a.manifest?.id ?? '').localeCompare(String(b.manifest?.id ?? '')));
	const verifierRegistries = walkFiles(resolve(guaranteesRoot, 'verifiers'))
		.filter((path) => /\.ya?ml$/u.test(path))
		.map((path) => ({ sourcePath: relative(packageRoot, path).replaceAll('\\', '/'), document: parse(readFileSync(path, 'utf8')) }))
		.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
	const packageJson = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'));
	writeDeclaration('standards/guarantee-catalog.json', `${JSON.stringify(canonicalize({
		schemaVersion: 'treeseed.guarantee-catalog/v1',
		package: { name: packageJson.name, version: packageJson.version },
		guarantees,
		verifierRegistries,
	}), null, 2)}\n`);
}

function writeGuaranteeVerifierContract() {
	writeDeclaration('standards/verifiers/team-ui-contract.json', `${JSON.stringify(canonicalize({
		schemaVersion: 'treeseed.guarantee-verifier-artifact/v1',
		artifactId: '@treeseed/admin/team-ui-contracts',
		entrypoint: 'dist/standards/verifiers/team-ui-contracts.js',
		cases: ['admin.team.ui-contracts', 'admin.identity-account.ui-contracts'],
	}), null, 2)}\n`);
}

function relativePathForTsconfig(targetPath) {
	return relative(packageRoot, targetPath).replaceAll('\\', '/');
}

function ignoreDeprecationsForInstalledTypescript() {
	try {
		const typescriptPackageJson = JSON.parse(readFileSync(requireFromPackage.resolve('typescript/package.json'), 'utf8'));
		const major = Number.parseInt(String(typescriptPackageJson.version ?? '').split('.')[0] ?? '', 10);
		return Number.isFinite(major) && major >= 6 ? '6.0' : '5.0';
	} catch {
		return '5.0';
	}
}

function writeDeclarationTsconfig() {
	const inheritedConfig = JSON.parse(readFileSync(resolve(packageRoot, 'tsconfig.json'), 'utf8'));
	const baseConfig = JSON.parse(readFileSync(resolve(packageRoot, 'tsconfig.build.json'), 'utf8'));
	const inheritedCompilerOptions = inheritedConfig.compilerOptions && typeof inheritedConfig.compilerOptions === 'object'
		? inheritedConfig.compilerOptions
		: {};
	const baseCompilerOptions = baseConfig.compilerOptions && typeof baseConfig.compilerOptions === 'object'
		? baseConfig.compilerOptions
		: {};
	const tsconfigPath = resolve(packageRoot, '.treeseed-tsconfig.build.generated.json');
	const mergedPaths = {
		...(inheritedCompilerOptions.paths ?? {}),
		...(baseCompilerOptions.paths ?? {}),
	};
	writeFileSync(tsconfigPath, `${JSON.stringify({
		extends: './tsconfig.build.json',
		compilerOptions: {
			...baseCompilerOptions,
			ignoreDeprecations: baseCompilerOptions.ignoreDeprecations ?? ignoreDeprecationsForInstalledTypescript(),
			outDir: relativePathForTsconfig(distRoot),
			paths: mergedPaths,
		},
		include: baseConfig.include ?? ['src/**/*'],
	}, null, 2)}\n`, 'utf8');
	return tsconfigPath;
}

function publishCompletedBuild() {
	const stagedFiles = walkFiles(distRoot);
	const expected = new Set(stagedFiles.map((filePath) => relative(distRoot, filePath)));
	mkdirSync(liveDistRoot, { recursive: true });
	for (const stagedFile of stagedFiles) {
		const outputFile = resolve(liveDistRoot, relative(distRoot, stagedFile));
		ensureDir(outputFile);
		try {
			renameSync(stagedFile, outputFile);
		} catch {
			cpSync(stagedFile, outputFile);
		}
	}
	for (const liveFile of walkFiles(liveDistRoot)) {
		if (!expected.has(relative(liveDistRoot, liveFile))) rmSync(liveFile, { force: true });
	}
}

function emitDeclarations() {
	const tsconfigPath = writeDeclarationTsconfig();
	let localTsc = null;
	try {
		localTsc = requireFromPackage.resolve('typescript/bin/tsc');
	} catch {
		localTsc = resolve(packageRoot, 'node_modules', 'typescript', 'bin', 'tsc');
	}
	const command = existsSync(localTsc) ? process.execPath : 'npx';
	const args = existsSync(localTsc) ? [localTsc, '-p', tsconfigPath] : ['--yes', '--package', 'typescript', 'tsc', '-p', tsconfigPath];
	const result = spawnSync(command, args, {
		cwd: packageRoot,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
	try {
		unlinkSync(tsconfigPath);
	} catch {
		// Best effort cleanup for interrupted declaration builds.
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

async function main() {
  const releaseBuildLock = await acquireBuildLock();
  try {
  rmSync(buildRoot, { recursive: true, force: true });
  mkdirSync(distRoot, { recursive: true });

  for (const filePath of walkFiles(srcRoot)) {
    const extension = extname(filePath);
    if (COMPILE_EXTENSIONS.has(extension) && !filePath.endsWith('.d.ts')) {
      await compileModule(filePath);
    } else if (COPY_EXTENSIONS.has(extension)) {
      copyAsset(filePath);
    }
  }

  emitDeclarations();

  writeDeclaration('index.d.ts', "export * from './routes.js';\nexport * from './commerce.js';\n");
  writeDeclaration('config.d.ts', "export { createTenantSite as createAdminSite } from '@treeseed/core/config';\n");
  writeDeclaration('content-config.d.ts', "export { createTenantCollections as createAdminCollections } from '@treeseed/core/content-config';\n");
  writeDeclaration('plugin.d.ts', "declare const plugin: import('@treeseed/sdk/site-contracts/plugin').TreeseedPlugin;\nexport default plugin;\nexport declare const ADMIN_ENV_SCHEMA: Record<string, unknown>;\nexport declare const ADMIN_CAPABILITIES: Record<string, unknown>;\n");
  writeDeclaration('routes.d.ts', "import type { TreeseedSiteRouteContribution } from '@treeseed/sdk/site-contracts/plugin';\nexport declare const ADMIN_ROUTES: TreeseedSiteRouteContribution[];\n");
  writeDeclaration('commerce.d.ts', readFileSync(resolve(srcRoot, 'commerce.ts'), 'utf8').replace(/export const DEFAULT_ADMIN_COMMERCE_PROVIDER[\s\S]*$/u, 'export declare const DEFAULT_ADMIN_COMMERCE_PROVIDER: AdminCommerceProvider;\n'));
  writeDeclaration('middleware.d.ts', "export declare const onRequest: any;\n");
  writeDeclaration('lib/market/catalog.d.ts', "export declare function createMarketTemplateCatalogProvider(...args: any[]): any;\n");
  writeDeclaration('lib/market/store.d.ts', "export declare function resolveApiStore(...args: any[]): any;\n");
  writeGuaranteeCatalog();
  writeGuaranteeVerifierContract();
  publishCompletedBuild();
  } finally {
	rmSync(buildRoot, { recursive: true, force: true });
    releaseBuildLock();
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

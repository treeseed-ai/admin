#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, extname, relative, resolve } from 'node:path';
import { build } from 'esbuild';

const packageRoot = resolve(new URL('..', import.meta.url).pathname);
const srcRoot = resolve(packageRoot, 'src');
const distRoot = resolve(packageRoot, 'dist');
const workspaceCoreDistRoot = resolve(packageRoot, '..', 'core', 'dist');
const workspaceSdkDistRoot = resolve(packageRoot, '..', 'sdk', 'dist');
const workspaceUiDistRoot = resolve(packageRoot, '..', 'ui', 'dist');

const COMPILE_EXTENSIONS = new Set(['.ts', '.tsx']);
const COPY_EXTENSIONS = new Set(['.astro', '.css', '.d.ts', '.js', '.json', '.yaml', '.yml']);

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

function relativePathForTsconfig(targetPath) {
	return relative(packageRoot, targetPath).replaceAll('\\', '/');
}

function existingWorkspaceDeclarationPaths() {
	const paths = {};
	if (existsSync(resolve(workspaceCoreDistRoot, 'index.d.ts'))) {
		Object.assign(paths, {
			'@treeseed/core': [relativePathForTsconfig(resolve(workspaceCoreDistRoot, 'index.d.ts'))],
			'@treeseed/core/middleware/editorial-preview': [relativePathForTsconfig(resolve(workspaceCoreDistRoot, 'middleware', 'editorial-preview.d.ts'))],
			'@treeseed/core/*/index': [relativePathForTsconfig(resolve(workspaceCoreDistRoot, '*', 'index.d.ts'))],
			'@treeseed/core/*': [relativePathForTsconfig(resolve(workspaceCoreDistRoot, '*.d.ts'))],
		});
	}
	if (existsSync(resolve(workspaceSdkDistRoot, 'index.d.ts'))) {
		Object.assign(paths, {
			'@treeseed/sdk': [relativePathForTsconfig(resolve(workspaceSdkDistRoot, 'index.d.ts'))],
			'@treeseed/sdk/platform/plugin': [relativePathForTsconfig(resolve(workspaceSdkDistRoot, 'platform', 'plugin.d.ts'))],
			'@treeseed/sdk/types': [relativePathForTsconfig(resolve(workspaceSdkDistRoot, 'sdk-types.d.ts'))],
			'@treeseed/sdk/types/*': [relativePathForTsconfig(resolve(workspaceSdkDistRoot, 'types', '*.d.ts'))],
			'@treeseed/sdk/*/index': [relativePathForTsconfig(resolve(workspaceSdkDistRoot, '*', 'index.d.ts'))],
			'@treeseed/sdk/*': [relativePathForTsconfig(resolve(workspaceSdkDistRoot, '*.d.ts'))],
		});
	}
	if (existsSync(resolve(workspaceUiDistRoot, 'index.d.ts'))) {
		Object.assign(paths, {
			'@treeseed/ui': [relativePathForTsconfig(resolve(workspaceUiDistRoot, 'index.d.ts'))],
			'@treeseed/ui/react': [relativePathForTsconfig(resolve(workspaceUiDistRoot, 'react.d.ts'))],
			'@treeseed/ui/theme': [relativePathForTsconfig(resolve(workspaceUiDistRoot, 'theme', 'index.d.ts'))],
			'@treeseed/ui/*/index': [relativePathForTsconfig(resolve(workspaceUiDistRoot, '*', 'index.d.ts'))],
			'@treeseed/ui/*': [relativePathForTsconfig(resolve(workspaceUiDistRoot, '*.d.ts'))],
		});
	}
	return paths;
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
		...existingWorkspaceDeclarationPaths(),
	};
	writeFileSync(tsconfigPath, `${JSON.stringify({
		extends: './tsconfig.build.json',
		compilerOptions: {
			...baseCompilerOptions,
			paths: mergedPaths,
		},
		include: baseConfig.include ?? ['src/**/*'],
	}, null, 2)}\n`, 'utf8');
	return tsconfigPath;
}

function emitDeclarations() {
	const tsconfigPath = writeDeclarationTsconfig();
	const localTsc = resolve(packageRoot, 'node_modules', 'typescript', 'bin', 'tsc');
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
  rmSync(distRoot, { recursive: true, force: true });
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

  writeDeclaration('index.d.ts', "export * from './routes.js';\nexport * from './commerce.js';\nexport * from './secret-managers.js';\n");
  writeDeclaration('config.d.ts', "export { createTreeseedTenantSite as createTreeseedAdminSite } from '@treeseed/core/config';\n");
  writeDeclaration('content-config.d.ts', "export { createTreeseedTenantCollections as createTreeseedAdminCollections } from '@treeseed/core/content-config';\n");
  writeDeclaration('plugin.d.ts', "declare const plugin: import('@treeseed/sdk/platform/plugin').TreeseedPlugin;\nexport default plugin;\nexport declare const ADMIN_ENV_SCHEMA: Record<string, unknown>;\nexport declare const ADMIN_CAPABILITIES: Record<string, unknown>;\n");
  writeDeclaration('routes.d.ts', "import type { TreeseedSiteRouteContribution } from '@treeseed/sdk/platform/plugin';\nexport declare const ADMIN_ROUTES: TreeseedSiteRouteContribution[];\n");
  writeDeclaration('commerce.d.ts', readFileSync(resolve(srcRoot, 'commerce.ts'), 'utf8').replace(/export const DEFAULT_ADMIN_COMMERCE_PROVIDER[\s\S]*$/u, 'export declare const DEFAULT_ADMIN_COMMERCE_PROVIDER: AdminCommerceProvider;\n'));
  writeDeclaration('secret-managers.d.ts', readFileSync(resolve(srcRoot, 'secret-managers.ts'), 'utf8').replace(/function unsupportedWrite[\s\S]*$/u, 'export declare const DEFAULT_SECRET_MANAGER_PROVIDERS: TreeseedSecretManagerProvider[];\n'));
  writeDeclaration('middleware.d.ts', "export declare const onRequest: any;\n");
  writeDeclaration('lib/market/catalog.d.ts', "export declare function createMarketTemplateCatalogProvider(...args: any[]): any;\n");
  writeDeclaration('lib/market/store.d.ts', "export declare function resolveApiStore(...args: any[]): any;\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

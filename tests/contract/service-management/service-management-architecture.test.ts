import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const readDependency = (name: string, path: string) => readFileSync(resolve(root, 'node_modules', name, path), 'utf8');

describe('service management architecture', () => {
	it('owns one provider-first route family with no legacy host route', () => {
		const routes = read('src/routes.ts');
		for (const route of ['/app/services', '/app/services/new', '/app/services/[connectionId]']) {
			expect(routes).toContain(`'${route}'`);
		}
		expect(routes).not.toContain('/app/hosts');
	});

	it('uses only shared UI components and the canonical enhanced form transport', () => {
		const collectionPage = read('src/pages/app/services/index.astro');
		expect(collectionPage).toContain('@treeseed/ui/components/astro/service/workspace/ServiceConnectionWorkspace.astro');
		for (const component of ['ProviderCard.astro', 'Panel.astro', 'SettingsTemplate.astro', 'SemanticCollectionSurface.astro']) {
			expect(collectionPage).not.toContain(component);
		}
		const workspace = readDependency('@treeseed/ui', 'dist/astro/service/workspace/ServiceConnectionWorkspace.astro');
		for (const component of ['ProviderCard', 'Panel', 'SettingsTemplate', 'SemanticCollectionSurface']) expect(workspace).toContain(component);
		const createPage = read('src/pages/app/services/new.astro');
		expect(createPage).toContain('@treeseed/ui/components/astro/service/workspace/ServiceConnectionCreateSurface.astro');
		const createSurface = readDependency('@treeseed/ui', 'dist/astro/service/workspace/ServiceConnectionCreateSurface.astro');
		for (const component of ['ProviderCard', 'Panel', 'SettingsTemplate', 'CapabilitySelector']) expect(createSurface).toContain(component);
		const pages = [
			read('src/pages/app/services/index.astro'),
			read('src/pages/app/services/new.astro'),
			read('src/pages/app/services/[connectionId].astro'),
		].join('\n');
		expect(createSurface).toContain('ProviderCard');
		expect(pages).toContain('@treeseed/ui/components/astro/templates/SettingsTemplate.astro');
		expect(pages).toContain('data-ts-submit="enhanced"');
		expect(pages).not.toMatch(/\bfetch\s*\(/u);
		expect(pages).not.toContain('window.alert');
	});

	it('uses one canonical routed tab model across collection, setup, detail, and vault pages', () => {
		const navigation = read('src/lib/services/navigation.ts');
		for (const label of ['Connections']) {
			expect(navigation).toContain(`'${label}'`);
		}
		expect(navigation.match(/label: '/gu)).toHaveLength(1);
		expect(navigation).not.toContain('Connect service');
		const detail = read('src/pages/app/services/[connectionId].astro');
		expect(detail).not.toContain('mode="panels"');
		expect(detail).not.toContain('SurfaceTabs');
		expect(detail).not.toContain('searchParams.get(\'tab\')');
	});

	it('uses core managed custody without a separate vault setup route', () => {
    const detail=read('src/pages/app/services/[connectionId].astro');
    expect(detail).toContain('Core OpenBao');expect(detail).toContain('managed-credentials');
    expect(read('src/routes.ts')).not.toContain('/app/services/vault');
  });

	it('sends credentials through authenticated enhanced forms without persistent browser custody', () => {
    const adapters=read('src/lib/services/form-adapters.ts');
    expect(adapters).toContain('Idempotency-Key');expect(adapters).toContain('x-treeseed-csrf');expect(adapters).toContain('expectedVersion');
    for(const retired of ['encryptServiceCredential','createTeamVaultGrant','localStorage','sessionStorage','document.cookie'])expect(adapters).not.toContain(retired);
  });

	it('supports portable topology references and isolated R2 state metadata', () => {
		const createSurface = readDependency('@treeseed/ui', 'dist/astro/service/workspace/ServiceConnectionCreateSurface.astro');
		const providerContracts = readDependency('@treeseed/sdk', 'dist/secrets-capability/service-provider-contracts.js');
		expect(createSurface).toContain('Connection reference');
		expect(createSurface).toContain('exactly match the topology connectionRef');
		expect(createSurface).toContain('database IDs never belong in Platform');
		for (const field of ['stateBucket', 'stateEndpoint', 'stateRegion', 'stateEncryptionKeyRef']) {
			expect(providerContracts).toContain(`field("${field}"`);
		}
	});

	it('renders service activity in the persisted user timezone', () => {
		for (const page of ['src/pages/app/services/index.astro', 'src/pages/app/services/[connectionId].astro']) {
			const source = read(page);
			expect(source).toContain('api.accountPreferences()');
			expect(source).toContain('timeZone={preferences.timeZone}');
		}
	});

	it('does not expose the removed shared-passphrase or hardcoded host permission components', () => {
		const layout = readDependency('@treeseed/ui', 'dist/astro/layouts/AppLayout.astro');
		const uiPackage = readDependency('@treeseed/ui', 'package.json');
		expect(layout).not.toContain('SensitiveDataUnlock');
		expect(uiPackage).not.toContain('SensitiveDataUnlock');
		expect(uiPackage).not.toContain('HostCredentialPermissionNote');
	});
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const readDependency = (name: string, path: string) => readFileSync(resolve(root, 'node_modules', name, path), 'utf8');

describe('service management architecture', () => {
	it('owns one provider-first route family with no legacy host route', () => {
		const routes = read('src/routes.ts');
		for (const route of ['/app/services', '/app/services/new', '/app/services/vault', '/app/services/[connectionId]']) {
			expect(routes).toContain(`'${route}'`);
		}
		expect(routes).not.toContain('/app/hosts');
	});

	it('uses only shared UI components and the canonical enhanced form transport', () => {
		const pages = [
			read('src/pages/app/services/index.astro'),
			read('src/pages/app/services/new.astro'),
			read('src/pages/app/services/[connectionId].astro'),
			read('src/pages/app/services/vault.astro'),
		].join('\n');
		expect(pages).toContain('@treeseed/ui/components/astro/service/ProviderCard.astro');
		expect(pages).toContain('@treeseed/ui/components/astro/templates/SettingsTemplate.astro');
		expect(pages).toContain('@treeseed/ui/components/astro/patterns/SetupProgress.astro');
		expect(pages).toContain('data-ts-submit="enhanced"');
		expect(pages).not.toMatch(/\bfetch\s*\(/u);
		expect(pages).not.toContain('window.alert');
	});

	it('uses one canonical routed tab model across collection, setup, detail, and vault pages', () => {
		const navigation = read('src/lib/services/navigation.ts');
		for (const label of ['Connections', 'Vault']) {
			expect(navigation).toContain(`'${label}'`);
		}
		expect(navigation.match(/label: '/gu)).toHaveLength(2);
		expect(navigation).not.toContain('Connect service');
		const detail = read('src/pages/app/services/[connectionId].astro');
		expect(detail).not.toContain('mode="panels"');
		expect(detail).not.toContain('SurfaceTabs');
		expect(detail).not.toContain('searchParams.get(\'tab\')');
	});

	it('guides vault setup through shared progress and explanation primitives', () => {
		const vault = read('src/pages/app/services/vault.astro');
		expect(vault).toContain('Secure credential setup');
		expect(vault).toContain('Credentials stay under your control');
		expect(vault).toContain('TreeSeed never retains');
		expect(vault).toContain('Recovery and custody rules');
		expect(vault).toContain('Step 1 of 3');
		expect(vault).toContain('Step 2 of 3');
		expect(vault).toContain('Step 3 of 3');
	});

	it('keeps secret operations in browser adapters and sends only envelopes', () => {
		const adapters = read('src/lib/services/form-adapters.ts');
		expect(adapters).toContain('encryptServiceVaultPrivateKey');
		expect(adapters).toContain('encryptServiceCredential');
		expect(adapters).toContain('createTeamVaultGrant');
		expect(adapters).toContain('openTeamVaultGrant');
		expect(adapters).not.toContain('localStorage');
		expect(adapters).not.toContain('sessionStorage');
		expect(adapters).not.toContain('document.cookie');
	});

	it('renders service activity in the persisted user timezone', () => {
		for (const page of ['src/pages/app/services/index.astro', 'src/pages/app/services/[connectionId].astro', 'src/pages/app/services/vault.astro']) {
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

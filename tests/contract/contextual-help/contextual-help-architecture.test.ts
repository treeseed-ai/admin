import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const readDependency = (name: string, path: string) => readFileSync(resolve(root, 'node_modules', name, path), 'utf8');
describe('Admin contextual help architecture', () => {
	it('declares knowledge as a remote published content contribution', () => {
		expect(read('treeseed.package.yaml')).toContain('contentContributions:');
		expect(read('treeseed.package.yaml')).toContain('path: src/content/knowledge');
		expect(read('treeseed.package.yaml')).toContain('contentRuntimeSource: r2_preview_overlay');
		expect(read('treeseed.package.yaml')).toContain('localContentMaterialization: none');
		expect(read('docs/src/manifest.yaml')).toContain('docs: ./src/content/knowledge');
	});

	it('maps every active account, team, invitation, and service route to a stable knowledge identity', () => {
		const routes = read('src/routes.ts');
		const routedPages = [...routes.matchAll(/knowledgePageIds:\s*\['([^']+)'\]/gu)].map((match) => match[1]);
		expect(routedPages.length).toBeGreaterThanOrEqual(15);
		for (const id of routedPages) expect(id).toMatch(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/u);
		for (const route of ['/app/account', '/app/teams', '/app/services', '/team-invites/[token]/accept']) {
			const line = routes.split('\n').find((candidate) => candidate.includes(`adminRoute('${route}'`));
			expect(line, route).toContain('knowledgePageIds');
		}
	});

	it('resolves every help trigger through stable remote content identities', () => {
		const sources = [
			'AccountDeletionPanel.astro',
			'AccountIdentitySettings.astro',
			'AccountTimeZoneSettings.astro',
			'NotificationPreferencePanel.astro',
			'PersonalThemeManager.astro',
		].map((path) => readDependency('@treeseed/ui', `dist/astro/account/${path}`)).concat([
			'src/pages/app/teams/index.astro',
			'src/pages/app/teams/new.astro',
			'src/pages/app/teams/[teamId]/index.astro',
			'src/pages/app/teams/[teamId]/edit.astro',
			'src/pages/app/teams/[teamId]/members.astro',
			'src/pages/app/teams/[teamId]/delete.astro',
			'src/pages/app/services/index.astro',
			'src/pages/app/services/new.astro',
			'src/pages/app/services/[connectionId].astro',
		].map(read)).join('\n');
		const literalIds = [...sources.matchAll(/knowledgePageId="([^"]+)"/gu)].map((match) => match[1]);
		expect(literalIds.length).toBeGreaterThan(20);
		for (const id of literalIds) expect(id).toMatch(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/u);
		expect(read('src/lib/help/context.ts')).toContain('/v1/knowledge/pages/{pageId}');
	});

	it('explains managed custody without asking for personal vault keys', () => {
    const page=read('src/pages/app/services/[connectionId].astro');
    expect(page).not.toContain('Core OpenBao stores encrypted team credentials.');
    expect(page).toContain('knowledgePageId="services.credentials"');
    expect(page).toContain('class="ts-form-stack"');
    expect(page).not.toContain('passphrase');
  });

	it('has one shared dialog transport and no legacy help implementation', () => {
		const uiPackage = readDependency('@treeseed/ui', 'package.json');
		const helpContext = read('src/lib/help/context.ts');
		const providerContracts = readDependency('@treeseed/sdk', 'dist/secrets-capability/service-provider-contracts.js');
		for (const legacy of ['HelpDrawer', 'HelpPopover', 'ContextualHelpPanel', 'ContentFieldHelp']) {
			expect(uiPackage).not.toContain(legacy);
		}
		expect(helpContext).toContain('/v1/knowledge/pages/{pageId}');
		expect(helpContext).toContain('loaded only when the user');
		expect(helpContext).not.toContain('createApiFacade');
		expect(helpContext).not.toMatch(/remark|markdown|innerHTML/iu);
		for (const embeddedProse of ['setupSteps', 'securityNotes', 'rotationGuidance']) {
			expect(providerContracts).not.toContain(embeddedProse);
		}
	});
});

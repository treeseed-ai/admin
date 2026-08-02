import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadKnowledgeCatalog } from '@treeseed/sdk/knowledge';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const pages = loadKnowledgeCatalog(resolve(root, 'docs/src/content/knowledge'), '@treeseed/admin');
const pageIds = new Set(pages.map((page) => page.id));

describe('Admin contextual help architecture', () => {
	it('declares knowledge as the canonical Admin content contribution', () => {
		expect(read('treeseed.package.yaml')).toContain('contentContributions:');
		expect(read('treeseed.package.yaml')).toContain('path: docs/src/content/knowledge');
		expect(read('docs/src/manifest.yaml')).toContain('docs: ./src/content/knowledge');
	});

	it('maps every active account, team, invitation, and service route to a published knowledge page', () => {
		const routes = read('src/routes.ts');
		const routedPages = [...routes.matchAll(/knowledgePageIds:\s*\['([^']+)'\]/gu)].map((match) => match[1]);
		expect(routedPages.length).toBeGreaterThanOrEqual(15);
		for (const id of routedPages) expect(pageIds.has(id), `${id} must be published`).toBe(true);
		for (const route of ['/app/account', '/app/teams', '/app/services', '/app/services/vault', '/team-invites/[token]/accept']) {
			const line = routes.split('\n').find((candidate) => candidate.includes(`adminRoute('${route}'`));
			expect(line, route).toContain('knowledgePageIds');
		}
	});

	it('resolves every local help trigger to the canonical Markdown catalog', () => {
		const sources = [
			'../ui/src/astro/account/AccountDeletionPanel.astro',
			'../ui/src/astro/account/AccountIdentitySettings.astro',
			'../ui/src/astro/account/AccountTimeZoneSettings.astro',
			'../ui/src/astro/account/NotificationPreferencePanel.astro',
			'../ui/src/astro/account/PersonalThemeManager.astro',
			'src/pages/app/teams/index.astro',
			'src/pages/app/teams/new.astro',
			'src/pages/app/teams/[teamId]/index.astro',
			'src/pages/app/teams/[teamId]/edit.astro',
			'src/pages/app/teams/[teamId]/members.astro',
			'src/pages/app/teams/[teamId]/delete.astro',
			'src/pages/app/services/index.astro',
			'src/pages/app/services/new.astro',
			'src/pages/app/services/[connectionId].astro',
			'src/pages/app/services/vault.astro',
		].map(read).join('\n');
		const literalIds = [...sources.matchAll(/knowledgePageId="([^"]+)"/gu)].map((match) => match[1]);
		expect(literalIds.length).toBeGreaterThan(20);
		for (const id of literalIds) expect(pageIds.has(id), `${id} must be published`).toBe(true);
	});

	it('makes vault passphrase reuse explicit and uses shared form spacing', () => {
		const vault = read('src/pages/app/services/vault.astro');
		expect(vault).toContain('Re-enter the personal vault passphrase you created in step 1.');
		expect(vault).toContain('This does not create a second or shared passphrase.');
		expect(vault).toContain('label="Step 1 personal vault passphrase"');
		expect(vault.match(/knowledgePageId="vault\.(?:personal-key|team-custody|recovery)"/gu)?.length).toBeGreaterThanOrEqual(3);
		expect(vault).toContain('class="ts-form-stack"');
		expect(vault).toContain('<FormActions');
	});

	it('has one shared dialog transport and no legacy help implementation', () => {
		const uiPackage = read('../ui/package.json');
		const helpContext = read('src/lib/help/context.ts');
		const providerContracts = read('../sdk/src/secrets-capability/service-provider-contracts.ts');
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

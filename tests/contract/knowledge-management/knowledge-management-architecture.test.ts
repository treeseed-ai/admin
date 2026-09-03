import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');
const dependencySource = (name: string, path: string) => readFileSync(resolve(root, 'node_modules', name, path), 'utf8');

describe('knowledge management architecture', () => {
	it('delegates the library composition to the shared UI feature surface', () => {
		const page = source('src/pages/app/knowledge/index.astro');
		expect(page).toContain("import { items } from '../../../lib/operations/records'");
		expect(page).toContain('items(await api.listTeamProjects');
		expect(page).toContain("reviews = items(await api.request('GET'");
		expect(page).toContain('collections = items(savedCollections); builds = items(packBuilds)');
		expect(page).toContain('@treeseed/ui/components/astro/knowledge/KnowledgeWorkbenchSurface.astro');
		const workbench = dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgeWorkbenchSurface.astro');
		for (const component of ['KnowledgeAuthoringForm', 'KnowledgeLifecyclePanel', 'KnowledgeLibrarySurface', 'KnowledgePackWorkbench', 'KnowledgeReviewCollection']) expect(workbench).toContain(component);
		expect(page).not.toContain('KnowledgeOutline.astro');
		expect(page).not.toContain('KnowledgeProjectCollection.astro');
		expect(page).not.toContain('BookList.astro');
		const library = dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgeLibrarySurface.astro');
		for (const component of ['BookList', 'KnowledgeOutline', 'KnowledgeProjectCollection', 'SemanticCollectionSurface']) {
			expect(library).toContain(component);
		}
		expect(page).not.toContain('/knowledge/publication-status');
		expect(page).not.toContain('<style');
		expect(page).not.toContain('fetch(');
		expect(page).not.toMatch(/refresh:\s*\{\s*targets/gu);
		expect(page).toContain("refreshTargets: ['[data-knowledge-review-list]']");
		expect(page).toContain("action === 'editorial-review'");
		expect(page).toContain('contextDigest: formValues.contextDigest');
		expect(page).toContain('payload: { workspace: saved.workspace }');
		expect(page.match(/payload: queued/gu)?.length).toBe(2);
		expect(workbench).toContain('Knowledge lifecycle is unavailable');
		expect(workbench).toContain('Archive and restore remain unavailable');
	});

	it('keeps authoring status server-controlled and exposes durable scene selectors', () => {
		const page = source('src/pages/app/knowledge/index.astro');
		for (const permission of ['knowledge:read', 'knowledge:author', 'knowledge:review', 'knowledge:publish',
			'knowledge:manage-books', 'knowledge:build-packs']) expect(page).toContain(permission);
		const workbench = dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgeWorkbenchSurface.astro');
		expect(workbench).toContain('Knowledge controls unavailable');
		expect(workbench).toContain('No mutation controls have been rendered.');
		expect(workbench).toContain('!canManageBooks ? null');
		expect(page).toContain("(canReview || canPublish) && Astro.url.searchParams.get('view') === 'reviews'");
		expect(page).toContain("canBuildPacks && Astro.url.searchParams.get('view') === 'packs'");
		const form = dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgeAuthoringForm.astro');
		expect(form).not.toContain('name="status"');
		expect(form).toContain('data-scene="knowledge.editor.form"');
		const reviews = dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgeReviewCollection.astro');
		expect(reviews).toContain('knowledge.review.decision');
		expect(reviews).toContain('data-review-paths');
		expect(reviews).toContain('data-review-decision');
		expect(reviews).toContain('knowledge.review.editorial');
		expect(form).toContain('name="audiencesPrimary"');
		expect(form).toContain('name="contextDigest"');
		expect(dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgePackWorkbench.astro')).toContain('knowledge.pack.build');
		const lifecycle = dependencySource('@treeseed/ui', 'dist/astro/knowledge/KnowledgeLifecyclePanel.astro');
		expect(lifecycle).toContain('href: item.resolutionHref');
		expect(lifecycle).toContain('disabled={dependencyItems.length > 0}');
	});

	it('uses one canonical reader and knowledge-backed contextual help', () => {
		expect(dependencySource('@treeseed/core', 'dist/pages/t/[teamSlug]/books/[bookSlug]/[...pageSlug].astro')).toContain('StarlightPage');
		expect(source('src/lib/help/context.ts')).toContain('/v1/knowledge/pages/');
		expect(source('src/lib/help/context.ts')).not.toContain('/v1/help/');
	});
});

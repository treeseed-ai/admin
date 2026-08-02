import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('knowledge management architecture', () => {
	it('composes the workbench exclusively from shared UI knowledge primitives', () => {
		const page = source('src/pages/app/knowledge/index.astro');
		for (const component of ['KnowledgeAuthoringForm', 'KnowledgeLifecyclePanel', 'KnowledgeOutline',
			'KnowledgePackWorkbench', 'KnowledgeProjectCollection', 'KnowledgePublicationStatus', 'KnowledgeReviewCollection']) {
			expect(page).toContain(`@treeseed/ui/components/astro/knowledge/${component}.astro`);
		}
		expect(page).not.toContain('<style');
		expect(page).not.toContain('fetch(');
		expect(page).not.toMatch(/refresh:\s*\{\s*targets/gu);
		expect(page).toContain("refreshTargets: ['[data-knowledge-review-list]']");
		expect(page).toContain("action === 'editorial-review'");
		expect(page).toContain('contextDigest: formValues.contextDigest');
		expect(page).toContain('payload: { workspace: saved.workspace }');
		expect(page.match(/payload: queued/gu)?.length).toBe(2);
		expect(page).toContain('Knowledge lifecycle is unavailable');
		expect(page).toContain('Archive and restore remain unavailable');
		expect(page).toContain('Knowledge lifecycle is unavailable');
		expect(page).toContain('Archive and restore remain unavailable');
	});

	it('keeps authoring status server-controlled and exposes durable scene selectors', () => {
		const page = source('src/pages/app/knowledge/index.astro');
		for (const permission of ['knowledge:read', 'knowledge:author', 'knowledge:review', 'knowledge:publish',
			'knowledge:manage-books', 'knowledge:build-packs']) expect(page).toContain(permission);
		expect(page).toContain('Knowledge controls unavailable');
		expect(page).toContain('No mutation controls have been rendered.');
		expect(page).toContain('!canManageBooks ? null');
		expect(page).toContain("(canReview || canPublish) && Astro.url.searchParams.get('view') === 'reviews'");
		expect(page).toContain("canBuildPacks && Astro.url.searchParams.get('view') === 'packs'");
		const form = source('../ui/src/astro/knowledge/KnowledgeAuthoringForm.astro');
		expect(form).not.toContain('name="status"');
		expect(form).toContain('data-scene="knowledge.editor.form"');
		const reviews = source('../ui/src/astro/knowledge/KnowledgeReviewCollection.astro');
		expect(reviews).toContain('knowledge.review.decision');
		expect(reviews).toContain('data-review-paths');
		expect(reviews).toContain('data-review-decision');
		expect(reviews).toContain('knowledge.review.editorial');
		expect(form).toContain('name="audiencesPrimary"');
		expect(form).toContain('name="contextDigest"');
		expect(source('../ui/src/astro/knowledge/KnowledgePackWorkbench.astro')).toContain('knowledge.pack.build');
		const lifecycle = source('../ui/src/astro/knowledge/KnowledgeLifecyclePanel.astro');
		expect(lifecycle).toContain('href: item.resolutionHref');
		expect(lifecycle).toContain('disabled={dependencyItems.length > 0}');
	});

	it('uses one canonical reader and knowledge-backed contextual help', () => {
		expect(source('../core/src/pages/t/[teamSlug]/books/[bookSlug]/[...pageSlug].astro')).toContain('StarlightPage');
		expect(source('src/lib/help/context.ts')).toContain('/v1/knowledge/pages/');
		expect(source('src/lib/help/context.ts')).not.toContain('/v1/help/');
	});
});

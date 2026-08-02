import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('feedback management architecture', () => {
	it('composes the authenticated launcher once through the shared application shell', () => {
		const layout = source('src/layouts/AppLayout.astro');
		expect(layout).toContain('feedbackContext={feedbackContext}');
		expect(layout).toContain("principalHasPlatformPermission(principal, 'feedback:read:global')");
		expect(layout).toContain("label: 'Feedback', href: '/app/feedback', icon: 'feedback'");
		expect(layout).not.toContain('<style');
	});

	it('restricts collection and detail routes to platform administrators', () => {
		const routes = source('src/routes.ts');
		const collection = source('src/pages/app/feedback/index.astro');
		const detail = source('src/pages/app/feedback/[feedbackId].astro');
		expect(routes).toContain('platform_admin');
		for (const current of [collection, detail]) expect(current).toContain('principalHasPlatformPermission');
		expect(routes).toContain("adminRoute('/app/feedback'");
		expect(routes).toContain("adminRoute('/app/feedback/[feedbackId]'");
		expect(collection).toContain('FeedbackFilterToolbar');
		expect(collection).toContain('FeedbackCollection');
		expect(detail).toContain('FeedbackStatusTimeline');
		expect(detail).toContain('PrivateAttachmentViewer');
		expect(detail).toContain('FeedbackResolutionForm');
		for (const current of [collection, detail]) expect(current).not.toContain('<style');
	});

	it('has no anonymous Core proxy or retired UI dialog implementation', () => {
		expect(existsSync('../core/src/pages/api/feedback/submit.ts')).toBe(false);
		expect(existsSync('../ui/src/astro/feedback/FeedbackDialog.astro')).toBe(false);
		expect(existsSync('../ui/src/lib/feedback/dialog.ts')).toBe(false);
	});

	it('publishes contextual guidance for submission, privacy, triage, and exports', () => {
		for (const topic of ['submitting', 'screenshot-privacy', 'administration', 'triage', 'privacy', 'exports']) {
			const content = source(`docs/src/content/knowledge/treeseed-feedback-and-support/${topic}.md`);
			expect(content).toContain('schemaVersion: treeseed.knowledge-page/v1');
		}
	});
});

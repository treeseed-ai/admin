import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WIREFRAME_PARITY, resolveDevelopmentScene } from '@treeseed/ui/foundation';
import { ADMIN_ROUTES } from '../../../src/routes.ts';

describe('pages 4–17 web parity', () => {
	it('registers every shared Admin route and deterministic responsive scene', () => {
		const routes = new Set(ADMIN_ROUTES.map((route) => route.pattern));
		for (const definition of WIREFRAME_PARITY) {
			expect(definition.renderers, definition.label).toEqual(['ink', 'web']);
			expect(routes.has(definition.adminRoute), definition.adminRoute).toBe(true);
			for (const viewport of ['narrow', 'medium', 'wide']) {
				const prefix = ['chat', 'inbox', 'discover'].includes(definition.surface) ? 'root' : 'surface';
				expect(resolveDevelopmentScene(`${prefix}.${definition.surface}.${viewport}`), `${definition.label}.${viewport}`).toBeDefined();
			}
		}
	});

	it('mounts live scene selection only through the shared development shell', () => {
		const layout = readFileSync('src/layouts/AppLayout.astro', 'utf8');
		expect(layout).toContain("import.meta.env.DEV ? resolveDevelopmentScene");
		expect(layout).toContain("searchParams.get('devScene')");
		expect(layout).toContain('developmentScene={developmentScene}');
		const launcher = readFileSync('src/pages/app/index.astro', 'utf8');
		expect(launcher).toContain('developmentSceneAdminRoute(requestedScene');
		expect(launcher).toContain("Astro.redirect(`${route}?devScene=");
	});
});

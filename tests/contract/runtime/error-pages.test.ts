import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('managed Admin error pages', () => {
	it('owns themed 404 and 500 states for authenticated and public routes', () => {
		for (const path of ['src/pages/404.astro', 'src/pages/500.astro']) {
			const page = source(path);
			expect(page).toContain("import TreeseedAppLayout from '../layouts/AppLayout.astro'");
			expect(page).toContain("Astro.url.pathname.startsWith('/app')");
			expect(page).toContain('PageHeader');
			expect(page).toContain('Panel');
			expect(page).toContain('Button');
			expect(page).not.toContain('<style');
		}
		expect(source('src/pages/404.astro')).toContain('PublicNotFound');
		const publicNotFound = source('src/components/runtime/PublicNotFound.astro');
		expect(publicNotFound).toContain("import TreeseedPublicLayout from '../../layouts/PublicLayout.astro'");
		expect(publicNotFound).toContain('Private teams and unpublished knowledge are intentionally unavailable');
		expect(source('src/pages/t/[name].astro')).toContain('<PublicNotFound currentPath={Astro.url.pathname}');
		expect(source('src/pages/500.astro')).toContain('No empty data has been inferred');
	});
});

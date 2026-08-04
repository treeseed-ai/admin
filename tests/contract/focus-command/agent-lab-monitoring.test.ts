import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');
const secondaryRoutes = ['agents.astro', 'workdays.astro', 'events.astro', 'assignments.astro', 'executions.astro', 'artifacts.astro'];
const navigatorRoutes = ['inbox', 'decisions', 'build', 'direction', 'results', 'find'];

describe('Agent Lab command header and navigator', () => {
	it('uses one shared chrome without conventional page or Command navigation', () => {
		const chrome = source('src/components/agent-lab/AgentLabChrome.astro');
		expect(chrome).toContain('AgentLabMonitor');
		expect(chrome).toContain('OperationsNavigator');
		for (const route of navigatorRoutes) expect(chrome).toContain(`/app/work/${route}`);
		for (const path of ['src/pages/app/work/index.astro', 'src/pages/app/work/[runId].astro', 'src/components/agent-lab/AgentLabEntityPage.astro']) {
			const page = source(path); expect(page).toContain('AgentLabChrome'); expect(page).not.toMatch(/<PageHeader\b|<ModeNavigation\b/u);
		}
		for (const route of secondaryRoutes) expect(source(`src/pages/app/work/${route}`)).toMatch(/AgentLabEntityPage|AgentLabChrome/u);
	});

	it('registers production-backed command routes with one reusable workspace', () => {
		const routes = source('src/routes.ts');
		for (const route of navigatorRoutes) {
			expect(routes).toContain(`/app/work/${route}`);
			expect(source(`src/pages/app/work/${route}.astro`)).toContain('AgentLabCommandPage');
		}
		const page = source('src/components/agent-lab/AgentLabCommandPage.astro');
		expect(page).toContain('CommandWorkspace');
		expect(page).toContain('AgentLabChrome');
	});

	it('preserves workday scope and keeps realtime ownership in UI', () => {
		const chrome = source('src/components/agent-lab/AgentLabChrome.astro');
		expect(chrome).toContain("params.set('date'"); expect(chrome).toContain("params.set('workday'");
		const monitor = source('src/components/agent-lab/AgentLabMonitor.astro');
		expect(monitor).not.toMatch(/setInterval|setTimeout|localStorage|fetch\(/u);
		expect(monitor).toContain('initialOverview={frame.overview}');
	});
});

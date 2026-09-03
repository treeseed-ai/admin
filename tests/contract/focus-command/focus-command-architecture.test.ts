import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');
const require = createRequire(import.meta.url);
const uiSource = (exportPath: string) => readFileSync(require.resolve(exportPath), 'utf8');

describe('Agent Lab content architecture', () => {
	it('keeps legacy Focus and Command URLs as static compatibility redirects', () => {
		for (const path of ['src/pages/app/focus/index.astro', 'src/pages/app/focus/questions.astro', 'src/pages/app/focus/proposals/index.astro', 'src/pages/app/focus/proposals/[proposalId].astro', 'src/pages/app/focus/decisions.astro']) {
			const page = source(path);
			expect(page, path).not.toMatch(/setInterval|setTimeout|client:load|pollInterval|EventSource/u);
			expect(page, path).toContain("Astro.redirect(`/app/work/");
			expect(page, path).toContain(', 308)');
		}
		const command = source('src/pages/app/command/index.astro');
		expect(command).toContain('Astro.redirect(`/app/work/direction');
		expect(command).toContain(', 308)');
		const lab = source('src/pages/app/work/index.astro');
		expect(lab).toContain('@treeseed/ui/components/astro/agent-lab/AgentLabHomeSurface.astro');
		const home = uiSource('@treeseed/ui/components/astro/agent-lab/AgentLabHomeSurface.astro');
		expect(home).toContain('react/agent-atlas');
		expect(home).toContain('client:load');
	});

	it('preserves shell ownership and highlights Follow on operational subpages', () => {
		const layout = source('src/layouts/AppLayout.astro');
		expect(layout).toContain("{ label: 'Follow', href: '/app/work', icon: 'capacity' }");
		expect(layout).not.toContain("{ label: 'Capacity'");
		expect(layout).not.toContain("{ label: 'Command'");
		expect(layout).not.toContain("{ label: 'Focus'");
		for (const path of ['src/pages/app/work/index.astro', 'src/pages/app/work/[runId].astro']) expect(source(path), path).toContain('currentPath="/app/work"');
	});

	it('keeps Agent Studio inspection-only and operations bounded to existing routes', () => {
		const studio = source('src/pages/app/projects/[projectId]/agents/[agentId].astro');
		expect(studio).toContain('@treeseed/ui/components/astro/project/AgentStudioSurface.astro');
		expect(studio).not.toMatch(/method="post"|method="POST"|data-ts-method/u);
		const studioSurface = uiSource('@treeseed/ui/components/astro/project/AgentStudioSurface.astro');
		expect(studioSurface).toContain('Inspection only');
		expect(studioSurface).not.toMatch(/method="post"|method="POST"|data-ts-method/u);
		const assignment = source('src/pages/app/command/assignments/[assignmentId].astro');
		expect(assignment).toContain("query.append('inspect', `assignment~${encoded}`)");
		expect(assignment).toContain('Astro.redirect(`/app/work/direction?');
		for (const path of ['src/pages/app/work/index.astro', 'src/pages/app/work/[runId].astro']) expect(source(path), path).toContain('const canManage = Boolean');
		const workday = uiSource('@treeseed/ui/components/astro/agent-lab/WorkdayDetailSurface.astro');
		expect(workday).toContain('data-ts-confirm');
		expect(workday).toContain('Authorized transitions');
	});

	it('loads capacity evidence through the existing project-scoped API contract', () => {
		const commandState = source('src/view-models/command/command-state.ts');
		expect(commandState).toContain('capacity/reservations?projectId=');
		expect(commandState).toContain('capacity/ledger?projectId=');
		expect(commandState).not.toContain('capacity/reservations?limit=');
		expect(commandState).not.toContain('capacity/ledger?limit=');
		const capacityPage = source('src/pages/app/capacity/index.astro');
		expect(capacityPage).toContain('/usage?projectId=');
		expect(capacityPage).not.toContain('/usage?limit=');
	});
});

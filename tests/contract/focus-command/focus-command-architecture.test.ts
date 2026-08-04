import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('Focus and Command content architecture', () => {
	it('keeps Focus static and Command live', () => {
		for (const path of ['src/pages/app/focus/index.astro', 'src/pages/app/focus/questions.astro', 'src/pages/app/focus/proposals/index.astro', 'src/pages/app/focus/proposals/[proposalId].astro', 'src/pages/app/focus/decisions.astro']) {
			const page = source(path);
			expect(page, path).not.toMatch(/setInterval|setTimeout|client:load|pollInterval|EventSource/u);
			expect(page, path).toContain('currentPath="/app/focus"');
		}
		const command = source('src/pages/app/command/index.astro');
		expect(command).toContain('LiveAgentActivityGantt');
		expect(command).toContain('@treeseed/ui/components/react/OperationsMonitor');
	});

	it('preserves shell ownership and highlights Command on operational subpages', () => {
		const layout = source('src/layouts/AppLayout.astro');
		expect(layout).toContain("{ label: 'Command', href: '/app/command', icon: 'capacity' }");
		expect(layout).toContain("{ label: 'Focus', href: '/app/focus', icon: 'work' }");
		expect(layout).not.toContain("{ label: 'Capacity'");
		expect(layout).not.toContain("{ label: 'Work'");
		for (const path of ['src/pages/app/work/index.astro', 'src/pages/app/work/[runId].astro', 'src/pages/app/capacity/index.astro']) expect(source(path), path).toContain('currentPath="/app/command"');
	});

	it('keeps Agent Studio inspection-only and operations bounded to existing routes', () => {
		const studio = source('src/pages/app/projects/[projectId]/agents/[agentId].astro');
		expect(studio).toContain('Inspection only');
		expect(studio).not.toMatch(/method="post"|method="POST"|data-ts-method/u);
		const assignment = source('src/pages/app/command/assignments/[assignmentId].astro');
		expect(assignment).toContain('/cancel');
		expect(assignment).toContain('/requeue');
		expect(assignment).toContain('data-ts-confirm');
		expect(assignment).toContain('canManage && (cancelEligible || requeueEligible)');
		for (const path of ['src/pages/app/work/index.astro', 'src/pages/app/work/[runId].astro']) expect(source(path), path).toContain('const canManage = Boolean');
		expect(source('src/pages/app/focus/questions.astro')).toContain('canSteward &&');
		expect(source('src/pages/app/focus/proposals/[proposalId].astro')).toContain('canSteward ? <Panel');
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

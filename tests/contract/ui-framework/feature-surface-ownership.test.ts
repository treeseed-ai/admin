import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('shared feature surface ownership', () => {
	it('keeps Chat composition and styling in UI', () => {
		const page = source('src/pages/app/chat/index.astro');
		expect(page).toContain('@treeseed/ui/components/astro/discussion/TeamChatWorkspace.astro');
		for (const detail of ['DiscussionWorkspace.astro', 'SemanticRegionSurface.astro', '<style>', 'ts-chat-project']) {
			expect(page).not.toContain(detail);
		}
	});

	it('keeps Books and Services route files at the server-adapter boundary', () => {
		const knowledge = source('src/pages/app/knowledge/index.astro');
		expect(knowledge).toContain('@treeseed/ui/components/astro/knowledge/KnowledgeWorkbenchSurface.astro');
		for (const detail of ['KnowledgeLibrarySurface.astro', 'KnowledgeAuthoringForm.astro', 'KnowledgeReviewCollection.astro', 'SettingsTemplate.astro', '<form', '<section', '<style>']) expect(knowledge).not.toContain(detail);

		const services = source('src/pages/app/services/index.astro');
		expect(services).toContain('@treeseed/ui/components/astro/service/workspace/ServiceConnectionWorkspace.astro');
		for (const detail of ['ProviderCard.astro', 'SettingsTemplate.astro', 'SemanticCollectionSurface.astro', '<style>']) expect(services).not.toContain(detail);
		const createService = source('src/pages/app/services/new.astro');
		expect(createService).toContain('@treeseed/ui/components/astro/service/workspace/ServiceConnectionCreateSurface.astro');
		for (const detail of ['ProviderCard.astro', 'CapabilitySelector.astro', 'SettingsTemplate.astro', '<form', '<section', '<style>']) expect(createService).not.toContain(detail);
	});

	it('keeps Projects and Capacity composition in UI', () => {
		const projects = source('src/pages/app/projects/index.astro');
		expect(projects).toContain('@treeseed/ui/components/astro/project/ProjectPortfolioSurface.astro');
		for (const detail of ['PageHeader.astro', 'ModeNavigation.astro', 'SemanticCollectionSurface.astro', '<style>', '<section']) expect(projects).not.toContain(detail);

		const capacity = source('src/pages/app/capacity/index.astro');
		expect(capacity).toContain('@treeseed/ui/components/astro/capacity/CapacityWorkspace.astro');
		for (const detail of ['CapacityControlRoom.astro', 'MetricGrid.astro', 'ResourceCard.astro', 'ModeNavigation.astro', '<style>', '<section', '<form']) expect(capacity).not.toContain(detail);
	});

	it('does not retain package-local mode navigation components', () => {
		expect(() => source('src/components/modes/ModeNavigation.astro')).toThrow();
		const projectPages = new Map([
			['src/pages/app/projects/[projectId]/index.astro', 'ProjectCommandSurface.astro'],
			['src/pages/app/projects/[projectId]/agents/index.astro', 'ProjectAgentsSurface.astro'],
			['src/pages/app/projects/[projectId]/agents/[agentId].astro', 'AgentStudioSurface.astro'],
		]);
		for (const [page, surface] of projectPages) {
			const pageSource = source(page);
			expect(pageSource).toContain(`@treeseed/ui/components/astro/project/${surface}`);
			for (const localPresentation of ['PageHeader.astro', 'ModeNavigation.astro', 'Panel.astro', 'ResourceCard.astro', '<section', '<style>', '<form']) {
				expect(pageSource).not.toContain(localPresentation);
			}
		}
	});

	it('keeps Agent Lab route composition in UI', () => {
		for (const removed of ['AgentLabMonitor.astro', 'AgentLabChrome.astro', 'AgentLabCommandPage.astro', 'AgentLabEntityPage.astro']) {
			expect(() => source(`src/components/agent-lab/${removed}`)).toThrow();
		}
		const routes = new Map([
			['src/pages/app/work/index.astro', 'AgentLabHomeSurface.astro'],
			['src/pages/app/work/inbox/index.astro', 'AgentLabCommandSurface.astro'],
			['src/pages/app/work/agents/index.astro', 'AgentLabEntitySurface.astro'],
			['src/pages/app/work/workdays/index.astro', 'WorkdayCollectionSurface.astro'],
			['src/pages/app/work/[runId].astro', 'WorkdayDetailSurface.astro'],
		]);
		for (const [page, surface] of routes) {
			const pageSource = source(page);
			expect(pageSource).toContain(`@treeseed/ui/components/astro/agent-lab/${surface}`);
			expect(pageSource).not.toMatch(/<PageHeader\b|<ModeNavigation\b|<section\b|<style\b/u);
		}
	});
});

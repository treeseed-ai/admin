import { buildPrivateKnowledgeReaderViewModel, type RuntimeReaderViewModel } from '@treeseed/core';
import { createApiFacade } from '../lib/market/api-client.ts';

export interface PrivateKnowledgePageViewModel {
	project: {
		id: string;
		teamId: string;
		name: string;
		slug: string;
	} | null;
	teams: unknown[];
	activeTeam: unknown | null;
	reader: RuntimeReaderViewModel;
	statusCode: number;
}

function statusFromReader(reader: RuntimeReaderViewModel) {
	if (reader.status === 'not_found') return 404;
	if (reader.status === 'unavailable') return 503;
	if (reader.status === 'denied') return 403;
	if (reader.status === 'requires_sign_in') return 401;
	return 200;
}

function errorStatus(error: unknown) {
	return Number((error as { status?: number } | null)?.status ?? 500);
}

function safeSlug(slug: unknown) {
	const clean = String(slug ?? '').trim().replace(/^\/+|\/+$/gu, '');
	return clean && !clean.includes('..') ? clean : 'index';
}

function currentRoute(projectId: string, slug: string) {
	return slug === 'index'
		? `/app/projects/${encodeURIComponent(projectId)}/knowledge`
		: `/app/projects/${encodeURIComponent(projectId)}/knowledge/${slug}`;
}

export async function loadPrivateKnowledgePageViewModel(context: any, projectId: string, slug: unknown): Promise<PrivateKnowledgePageViewModel> {
	const api = createApiFacade(context);
	const normalizedSlug = safeSlug(slug);
	const route = currentRoute(projectId, normalizedSlug);
	const teams = await api.listTeamsForPrincipal().catch(() => []);
	try {
		const access = await api.validatePrivateKnowledgeAccess(projectId, { slug: normalizedSlug, route });
		const project = access.project ?? null;
		const reader = await buildPrivateKnowledgeReaderViewModel({
			locals: context.locals,
			projectId,
			teamId: project?.teamId ?? '',
			slug: normalizedSlug === 'index' ? '' : normalizedSlug,
			access: 'allowed',
		});
		if (reader.status === 'ready') {
			await api.recordPrivateKnowledgeOutcome(projectId, { slug: normalizedSlug, route, outcome: 'read' }).catch(() => null);
		} else if (reader.status === 'not_found') {
			await api.recordPrivateKnowledgeOutcome(projectId, { slug: normalizedSlug, route, outcome: 'not_found' }).catch(() => null);
		}
		const activeTeam = Array.isArray(teams)
			? teams.find((team: any) => team.id === project?.teamId || team.teamId === project?.teamId) ?? null
			: null;
		return { project, teams, activeTeam, reader, statusCode: statusFromReader(reader) };
	} catch (error) {
		const status = errorStatus(error);
		const access = status === 401 ? 'requires_sign_in' : 'denied';
		const reader = await buildPrivateKnowledgeReaderViewModel({
			locals: context.locals,
			projectId,
			teamId: '',
			slug: normalizedSlug === 'index' ? '' : normalizedSlug,
			access,
		});
		return { project: null, teams, activeTeam: null, reader, statusCode: statusFromReader(reader) };
	}
}

import type { HelpContext, KnowledgeHelpLink, KnowledgeHelpPage } from '@treeseed/ui';
import type { APIContext } from 'astro';
import { ADMIN_ROUTES } from '../../routes.ts';

function routeRegex(pattern: string) {
	const source = pattern.split('/').map((segment) => (
		/^\[[^\]]+\]$/u.test(segment)
			? '[^/]+'
			: segment.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
	)).join('/');
	return new RegExp(`^${source}/?$`, 'u');
}

function routeFor(pathname: string) {
	for (const route of ADMIN_ROUTES) {
		if (!routeRegex(route.pattern).test(pathname)) continue;
		const patternSegments = route.pattern.split('/');
		const pathSegments = pathname.replace(/\/+$/u, '').split('/');
		const params = Object.fromEntries(patternSegments.flatMap((segment, index) => {
			const match = segment.match(/^\[([^\]]+)\]$/u);
			return match && pathSegments[index] ? [[match[1], decodeURIComponent(pathSegments[index])]] : [];
		}));
		return { route, params };
	}
	return null;
}

export async function loadRouteHelpContext(
	astro: APIContext,
	pathname: string,
	teamId?: string,
	options: { shell?: HelpContext['shell']; context?: HelpContext['context'] } = {},
): Promise<HelpContext | undefined> {
	const matched = routeFor(pathname);
	const route = matched?.route;
	const capability = route?.capability;
	const knowledgePageId = capability?.knowledgePageIds?.[0];
	if (!route || !capability || !knowledgePageId) return undefined;
	const scopedTeamId = matched?.params.teamId ?? teamId;
	// Help content is runtime-owned and intentionally loaded only when the user
	// opens the dialog. Server-rendering an application route must never wait on
	// a federated content or graph query.
	const page: KnowledgeHelpPage | undefined = undefined;
	const relatedDocs: KnowledgeHelpLink[] = [];
	return {
		capabilityId: capability.id,
		knowledgePageIds: [knowledgePageId],
		shell: options.shell ?? 'product',
		context: options.context ?? (capability.surface === 'personal' ? 'personal' : 'team'),
		resourceType: capability.resourceType,
		routePattern: route.pattern,
		canonicalPath: pathname,
		summary: `Open guidance for ${capability.description}`,
		knowledgePages: page ? [page] : [],
		relatedDocs,
		relatedActions: [],
		searchScope: 'global',
		visibility: 'authenticated',
		pageEndpoint: '/v1/knowledge/pages/{pageId}',
		searchEndpoint: '/v1/knowledge/search',
		teamId: scopedTeamId,
		locale: 'en',
	};
}

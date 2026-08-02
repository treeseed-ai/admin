import type { APIRoute } from 'astro';
import { apiServiceHeaders, resolveApiBaseUrl } from '../../../../../lib/market/api-client';

export const GET: APIRoute = async (context) => {
	if (!context.locals.auth?.principal) return context.redirect('/auth/sign-in');
	const buildId = String(context.params.buildId ?? '');
	const response = await fetch(`${resolveApiBaseUrl(context.locals)}/v1/knowledge/packs/${encodeURIComponent(buildId)}/download`, {
		headers: apiServiceHeaders(context),
	});
	if (!response.ok) return new Response('The knowledge pack could not be downloaded.', { status: response.status });
	return new Response(response.body, { status: 200, headers: {
		'Content-Type': response.headers.get('content-type') ?? 'application/zip',
		'Content-Disposition': response.headers.get('content-disposition') ?? `attachment; filename="knowledge-pack-${buildId}.zip"`,
		'Cache-Control': 'private, no-store',
	} });
};

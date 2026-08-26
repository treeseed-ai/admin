import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
	const apiBaseUrl = String((locals.runtime?.env as Record<string, unknown> | undefined)?.TREESEED_API_BASE_URL
		?? process.env.TREESEED_API_BASE_URL ?? '').replace(/\/+$/u, '');
	if (!apiBaseUrl) return new Response(JSON.stringify({ ok: false, dependency: 'api', status: 'unconfigured' }), {
		status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});
	const api = await fetch(`${apiBaseUrl}/healthz`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(2_000) }).catch(() => null);
	return new Response(JSON.stringify({ ok: Boolean(api?.ok), dependency: 'api', status: api?.ok ? 'ready' : 'unavailable' }), {
		status: api?.ok ? 200 : 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});
};

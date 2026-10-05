import type { APIRoute } from 'astro';
import { resolveApiBaseUrl } from '../../lib/market/api-client';
import { apiRequestHeaders } from '../../lib/auth/application-session';
import { csrfMatches, WEB_CSRF_HEADER } from '../../lib/auth/support/csrf';
import { promoteConcurrencyHeader, signedConfirmationHeader } from '../../lib/market/proxy-request';

export const prerender = false;

const hopByHopHeaders = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'host',
]);

function copyClientHeaders(request: Request) {
	const headers = new Headers();
	for (const [name, value] of request.headers) {
		const lower = name.toLowerCase();
		if (hopByHopHeaders.has(lower)) continue;
		if (lower === 'cookie') continue;
		if (lower === 'authorization' || lower.startsWith('x-treeseed-service-') || lower === 'x-treeseed-user-assertion') continue;
		if (lower === 'x-treeseed-feedback-path') continue;
		headers.set(name, value);
	}
	return headers;
}

export const ALL: APIRoute = async (context) => {
	const path = context.params.all ?? '';

	const upstreamPath = path === 'healthz' || path.startsWith('healthz/')
		? `/${path}`
		: `/v1/${path}`;
	const upstream = new URL(upstreamPath, resolveApiBaseUrl(context.locals));
	upstream.search = context.url.search;

	const headers = copyClientHeaders(context.request);
	if (path === 'feedback') {
		try {
			const referrer = new URL(context.request.headers.get('referer') ?? '', context.url.origin);
			if (referrer.origin === context.url.origin) headers.set('x-treeseed-feedback-path', `${referrer.pathname}${referrer.search}`.slice(0, 600));
		} catch { /* A missing or malformed referrer leaves the API's safe root fallback. */ }
	}
	const incomingMethod = context.request.method.toUpperCase();
	if (!['GET', 'HEAD', 'OPTIONS'].includes(incomingMethod)) {
		const candidate = context.request.headers.get(WEB_CSRF_HEADER);
		if (!csrfMatches(context, candidate)) {
			return new Response(JSON.stringify({ ok: false, error: 'The request failed CSRF validation.', code: 'csrf' }), { status: 403, headers: { 'content-type': 'application/json' } });
		}
	}
	for (const [name, value] of apiRequestHeaders(context)) headers.set(name, value);

	const method = context.request.method.toUpperCase();
	const body = ['GET', 'HEAD'].includes(method) ? undefined : await context.request.arrayBuffer();
	promoteConcurrencyHeader(headers, body);
	let response = await fetch(upstream, {
		method,
		headers,
		body,
		redirect: 'manual',
		signal: context.request.signal,
	});
	const confirmation = await signedConfirmationHeader(response);
	if (confirmation) {
		headers.set('x-treeseed-confirmation', confirmation);
		response = await fetch(upstream, { method, headers, body, redirect: 'manual', signal: context.request.signal });
	}

	const responseHeaders = new Headers();
	for (const [name, value] of response.headers) {
		if (!hopByHopHeaders.has(name.toLowerCase()) && name.toLowerCase() !== 'set-cookie') responseHeaders.set(name, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
	});
};

import type { APIRoute } from 'astro';
import { isSupportedAuthProvider, normalizeReturnTo } from '../../../lib/auth/flow';
import { resolveApiBaseUrl, setApiAccessTokenCookie } from '../../../lib/market/api-client';

export const prerender = false;

const callback: APIRoute = async (context) => {
	const provider = context.params.provider ?? 'unknown';
	if (!isSupportedAuthProvider(provider)) {
		return context.redirect('/auth/sign-in?error=unsupported_provider', 302);
	}
	const target = new URL(`/v1/auth/oauth/${provider}/callback`, resolveApiBaseUrl(context.locals));
	let body: URLSearchParams | undefined;
	if (context.request.method === 'POST') {
		const form = await context.request.formData();
		body = new URLSearchParams();
		for (const [key, value] of form) if (typeof value === 'string') body.append(key, value);
	} else {
		target.search = context.url.search;
	}
	const response = await fetch(target, {
		method: context.request.method === 'POST' ? 'POST' : 'GET',
		headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
		body,
		redirect: 'manual',
	});
	const envelope = await response.json().catch(() => null);
	if (!response.ok || envelope?.ok === false || !envelope?.payload?.accessToken) {
		const message = envelope?.error ?? 'OAuth sign-in is unavailable.';
		return context.redirect(`/auth/sign-in?error=${encodeURIComponent(message)}`, 302);
	}
	setApiAccessTokenCookie(context, envelope.payload.accessToken, Number(envelope.payload.expiresInSeconds ?? 900));
	const redirectTo = typeof envelope.payload.returnTo === 'string' && envelope.payload.returnTo.startsWith('/') && !envelope.payload.returnTo.startsWith('//')
		? envelope.payload.returnTo
		: normalizeReturnTo(context);
	const redirect = context.redirect(redirectTo, 302);
	for (const cookie of context.cookies.headers()) redirect.headers.append('set-cookie', cookie);
	return redirect;
};

export const GET = callback;
export const POST = callback;

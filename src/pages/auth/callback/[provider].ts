import type { APIRoute } from 'astro';
import { isSupportedAuthProvider, normalizeReturnTo } from '../../../lib/auth/support/flow';
import { resolveApiBaseUrl, setApiAccessTokenCookie, setApiRefreshTokenCookie } from '../../../lib/market/api-client';
import { ADMIN_OAUTH_CLIENT_ID, OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE,
	adminCallbackUrl, clearAdminAuthorizationCookies, oauthProtocolRequest } from '../../../lib/auth/oauth-browser';

export const prerender = false;

const callback: APIRoute = async (context) => {
	const provider = context.params.provider ?? 'unknown';
	if (provider === 'treeseed') {
		const state = context.url.searchParams.get('state') ?? '';
		const expectedState = context.cookies.get(OAUTH_STATE_COOKIE)?.value ?? '';
		const verifier = context.cookies.get(OAUTH_VERIFIER_COOKIE)?.value ?? '';
		const code = context.url.searchParams.get('code') ?? '';
		if (!state || state !== expectedState || !verifier || !code || context.url.searchParams.has('error')) {
			clearAdminAuthorizationCookies(context);
			return context.redirect('/auth/sign-in?error=invalid_oauth_callback', 303);
		}
		const response = await oauthProtocolRequest(context, '/oauth/token', { method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({
				client_id: ADMIN_OAUTH_CLIENT_ID, grant_type: 'authorization_code', code,
				redirect_uri: adminCallbackUrl(context), code_verifier: verifier,
			}) });
		const tokens = await response.json().catch(() => null);
		if (!response.ok || !tokens?.access_token || !tokens?.refresh_token) {
			clearAdminAuthorizationCookies(context);
			return context.redirect('/auth/sign-in?error=oauth_exchange_failed', 303);
		}
		const returnTo = context.cookies.get(OAUTH_RETURN_COOKIE)?.value ?? '/app/';
		setApiAccessTokenCookie(context, tokens.access_token, Number(tokens.expires_in ?? 900));
		setApiRefreshTokenCookie(context, tokens.refresh_token);
		clearAdminAuthorizationCookies(context);
		return context.redirect(returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/app/', 303);
	}
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

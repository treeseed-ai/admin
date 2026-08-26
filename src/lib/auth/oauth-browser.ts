import type { APIContext } from 'astro';
import { randomId, resolveApiBaseUrl } from '../market/api-client';

export const ADMIN_OAUTH_CLIENT_ID = 'treeseed-admin';
export const OAUTH_VERIFIER_COOKIE = 'ts_admin_oauth_verifier';
export const OAUTH_STATE_COOKIE = 'ts_admin_oauth_state';
export const OAUTH_RETURN_COOKIE = 'ts_admin_oauth_return';

export function adminCallbackUrl(context: Pick<APIContext, 'url'>) {
	return new URL('/auth/callback/treeseed', context.url.origin).toString();
}

function cookieOptions(context: Pick<APIContext, 'url'>) {
	return { httpOnly: true, path: '/', sameSite: 'lax' as const, secure: context.url.protocol === 'https:', maxAge: 600 };
}

function base64Url(bytes: Uint8Array) {
	return Buffer.from(bytes).toString('base64url');
}

export async function beginAdminAuthorization(context: Pick<APIContext, 'cookies' | 'url'>, returnTo = '/app/') {
	const verifierBytes = new Uint8Array(48);
	globalThis.crypto.getRandomValues(verifierBytes);
	const verifier = base64Url(verifierBytes);
	const challenge = base64Url(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
	const state = randomId();
	const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/app/';
	context.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookieOptions(context));
	context.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions(context));
	context.cookies.set(OAUTH_RETURN_COOKIE, safeReturn, cookieOptions(context));
	const target = new URL('/auth/authorize', context.url.origin);
	target.search = new URLSearchParams({ client_id: ADMIN_OAUTH_CLIENT_ID, redirect_uri: adminCallbackUrl(context),
		response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256',
		scope: 'treeseed:read', state }).toString();
	return target;
}

export function clearAdminAuthorizationCookies(context: Pick<APIContext, 'cookies' | 'url'>) {
	for (const name of [OAUTH_VERIFIER_COOKIE, OAUTH_STATE_COOKIE, OAUTH_RETURN_COOKIE]) {
		context.cookies.delete(name, { path: '/', secure: context.url.protocol === 'https:' });
	}
}

export async function oauthProtocolRequest(context: Pick<APIContext, 'locals'>, path: string, init?: RequestInit) {
	return fetch(`${resolveApiBaseUrl(context.locals)}${path}`, { ...init, headers: { accept: 'application/json', ...init?.headers }, redirect: 'manual' });
}

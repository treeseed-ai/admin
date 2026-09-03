import type { APIContext } from 'astro';
import { getSiteAuthConfig } from './configuration/config';
import { randomId, resolveApiBaseUrl, safeTokenEquals, signAssertionPayload } from '../market/api-client';

export const ADMIN_OAUTH_CLIENT_ID = 'treeseed-admin';
export const ADMIN_OAUTH_SCOPES = ['treeseed:read', 'treeseed:projects:write'] as const;
export const OAUTH_VERIFIER_COOKIE = 'ts_admin_oauth_verifier';
export const OAUTH_STATE_COOKIE = 'ts_admin_oauth_state';
export const OAUTH_RETURN_COOKIE = 'ts_admin_oauth_return';

function adminOrigin(context: Pick<APIContext, 'locals' | 'url'>) {
	const runtime = (context.locals as App.Locals | undefined)?.runtime?.env as Record<string, unknown> | undefined;
	const developmentMode = ['TREESEED_DEVELOPMENT_MODE', 'TREESEED_LOCAL_DEV_MODE', 'LOCAL_DEV_MODE']
		.some((name) => {
			const value = runtime?.[name] ?? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
			return typeof value === 'string' && ['1', 'true', 'yes', 'on', 'live', 'development', 'local'].includes(value.trim().toLowerCase());
		});
	if (developmentMode && ['localhost', '127.0.0.1', '::1', '[::1]'].includes(context.url.hostname)) {
		return context.url.origin;
	}
	return new URL(getSiteAuthConfig(context).siteBaseUrl).origin;
}

export function adminCallbackUrl(context: Pick<APIContext, 'locals' | 'url'>) {
	return new URL('/auth/callback/treeseed', adminOrigin(context)).toString();
}

function cookieOptions(context: Pick<APIContext, 'locals' | 'url'>) {
	return { httpOnly: true, path: '/', sameSite: 'lax' as const, secure: adminOrigin(context).startsWith('https:'), maxAge: 600 };
}

function base64Url(bytes: Uint8Array) {
	return Buffer.from(bytes).toString('base64url');
}

function sealAuthorizationValue(context: Pick<APIContext, 'locals'>, value: string) {
	return `${value}.${signAssertionPayload(value, getSiteAuthConfig(context).csrfSecret)}`;
}

export function readAdminAuthorizationCookie(
	context: Pick<APIContext, 'cookies' | 'locals'>,
	name: typeof OAUTH_VERIFIER_COOKIE | typeof OAUTH_STATE_COOKIE | typeof OAUTH_RETURN_COOKIE,
) {
	const sealed = context.cookies.get(name)?.value ?? '';
	const separator = sealed.lastIndexOf('.');
	if (separator <= 0) return '';
	const value = sealed.slice(0, separator);
	const signature = sealed.slice(separator + 1);
	const expected = signAssertionPayload(value, getSiteAuthConfig(context).csrfSecret);
	return safeTokenEquals(signature, expected) ? value : '';
}

export async function beginAdminAuthorization(context: Pick<APIContext, 'cookies' | 'url' | 'locals'>, returnTo = '/app/') {
	const verifierBytes = new Uint8Array(48);
	globalThis.crypto.getRandomValues(verifierBytes);
	const verifier = base64Url(verifierBytes);
	const challenge = base64Url(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
	const state = randomId();
	const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/app/';
	context.cookies.set(OAUTH_VERIFIER_COOKIE, sealAuthorizationValue(context, verifier), cookieOptions(context));
	context.cookies.set(OAUTH_STATE_COOKIE, sealAuthorizationValue(context, state), cookieOptions(context));
	context.cookies.set(OAUTH_RETURN_COOKIE, sealAuthorizationValue(context, safeReturn), cookieOptions(context));
	const target = new URL('/auth/authorize', adminOrigin(context));
	target.search = new URLSearchParams({ client_id: ADMIN_OAUTH_CLIENT_ID, redirect_uri: adminCallbackUrl(context),
		response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256',
		scope: ADMIN_OAUTH_SCOPES.join(' '), state }).toString();
	return target;
}

export async function completeAdminCredentialAuthorization(
	context: Pick<APIContext, 'cookies' | 'url' | 'locals'>,
	credentials: { identifier: string; password: string },
	returnTo = '/app/',
) {
	const target = await beginAdminAuthorization(context, returnTo);
	const requestPath = `/oauth/authorize?${target.searchParams.toString()}`;
	const read = await oauthProtocolRequest(context, requestPath);
	const presentation = await read.json().catch(() => null);
	if (!read.ok || presentation?.clientId !== ADMIN_OAUTH_CLIENT_ID
		|| presentation?.redirectUri !== adminCallbackUrl(context)
		|| presentation?.state !== target.searchParams.get('state')) {
		throw new Error(presentation?.error_description ?? 'The TreeSeed sign-in request is invalid or expired.');
	}
	const body = new URLSearchParams({
		client_id: presentation.clientId,
		redirect_uri: presentation.redirectUri,
		response_type: presentation.responseType,
		code_challenge: presentation.codeChallenge,
		code_challenge_method: presentation.codeChallengeMethod,
		scope: presentation.scopes.join(' '),
		state: presentation.state,
		decision: 'approve',
		identifier: credentials.identifier,
		password: credentials.password,
	});
	const response = await oauthProtocolRequest(context, '/oauth/authorize', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body,
	});
	const result = await response.json().catch(() => null);
	if (!response.ok || !result?.redirectTo) {
		throw new Error(result?.error_description ?? 'Sign in could not be completed.');
	}
	const callback = new URL(result.redirectTo);
	const expected = new URL(adminCallbackUrl(context));
	if (callback.origin !== expected.origin || callback.pathname !== expected.pathname
		|| callback.searchParams.get('state') !== presentation.state) {
		throw new Error('The TreeSeed sign-in callback was rejected.');
	}
	return callback;
}

export function clearAdminAuthorizationCookies(context: Pick<APIContext, 'cookies' | 'locals' | 'url'>) {
	for (const name of [OAUTH_VERIFIER_COOKIE, OAUTH_STATE_COOKIE, OAUTH_RETURN_COOKIE]) {
		context.cookies.delete(name, { path: '/', secure: adminOrigin(context).startsWith('https:') });
	}
}

export async function oauthProtocolRequest(context: Pick<APIContext, 'locals'>, path: string, init?: RequestInit) {
	return fetch(`${resolveApiBaseUrl(context.locals)}${path}`, { ...init, headers: { accept: 'application/json', ...init?.headers }, redirect: 'manual' });
}

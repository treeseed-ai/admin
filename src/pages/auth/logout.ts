import type { APIRoute } from 'astro';
import { requireCsrf } from '../../lib/auth/support/csrf';
import { apiAccessTokenFromCookies, apiRefreshTokenFromCookies, clearApiAccessTokenCookie, clearApiRefreshTokenCookie,
	resolveApiBaseUrl } from '../../lib/market/api-client';
import { pageFormFailure, pageFormResponse } from '../../lib/forms/page-submission';

export const prerender = false;

export const GET: APIRoute = async (context) => context.redirect(context.locals.auth?.principal ? '/app/' : '/auth/sign-in', 303);

export const POST: APIRoute = async (context) => {
	const form = await context.request.formData();
	const requestedReturnTo = String(form.get('returnTo') ?? '');
	const inviteToken = String(form.get('inviteToken') ?? '').trim();
	const inviteEmail = String(form.get('inviteEmail') ?? '').trim();
	const returnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//')
		? requestedReturnTo
		: '';
	const signInParams = new URLSearchParams({ signedOut: '1' });
	if (returnTo) signInParams.set('returnTo', returnTo);
	if (inviteToken && inviteToken.length <= 512) signInParams.set('inviteToken', inviteToken);
	if (inviteEmail && inviteEmail.length <= 320) signInParams.set('inviteEmail', inviteEmail);
	const signInPath = `/auth/sign-in?${signInParams.toString()}`;
	try {
		requireCsrf(context, form.get('csrfToken'));
		const tokens = [apiAccessTokenFromCookies(context), apiRefreshTokenFromCookies(context)].filter(Boolean) as string[];
		await Promise.all(tokens.map((token) => fetch(`${resolveApiBaseUrl(context.locals)}/oauth/revoke`, { method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ client_id: 'treeseed-admin', token }),
		}).catch(() => null)));
		clearApiAccessTokenCookie(context);
		clearApiRefreshTokenCookie(context);
		return pageFormResponse(context, {
			ok: true,
			code: 'signed_out',
			message: 'You have been signed out.',
			redirect: signInPath,
		}, signInPath);
	} catch {
		return pageFormFailure(context, 'Unable to sign out.', '/auth/sign-in');
	}
};

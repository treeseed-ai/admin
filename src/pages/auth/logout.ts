import type { APIRoute } from 'astro';
import { requireCsrf } from '../../lib/auth/support/csrf';
import { clearApiAccessTokenCookie, createApiFacade } from '../../lib/market/api-client';
import { pageFormFailure, pageFormResponse } from '../../lib/forms/page-submission';

export const prerender = false;

export const GET: APIRoute = async (context) => context.redirect(context.locals.auth?.principal ? '/app/' : '/auth/sign-in', 303);

export const POST: APIRoute = async (context) => {
	const form = await context.request.formData();
	try {
		requireCsrf(context, form.get('csrfToken'));
		await createApiFacade(context).request('POST', '/v1/auth/logout', { body: {} });
		clearApiAccessTokenCookie(context);
		return pageFormResponse(context, {
			ok: true,
			code: 'signed_out',
			message: 'You have been signed out.',
			redirect: '/auth/sign-in?signedOut=1',
		}, '/auth/sign-in');
	} catch {
		return pageFormFailure(context, 'Unable to sign out.', '/auth/sign-in');
	}
};

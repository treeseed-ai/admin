import type { APIRoute } from 'astro';
import { requireCsrf } from '../../lib/auth/csrf';
import { clearApiAccessTokenCookie, createApiFacade } from '../../lib/market/api-client';

export const prerender = false;

export const GET: APIRoute = async (context) => context.redirect(context.locals.auth?.principal ? '/app/' : '/auth/sign-in', 303);

export const POST: APIRoute = async (context) => {
	const form = await context.request.formData();
	try {
		requireCsrf(context, form.get('csrfToken'));
		await createApiFacade(context).request('POST', '/v1/auth/logout', { body: {} });
		clearApiAccessTokenCookie(context);
		const response = context.redirect('/auth/sign-in?signedOut=1', 303);
		for (const cookie of context.cookies.headers()) response.headers.append('set-cookie', cookie);
		return response;
	} catch {
		return context.redirect('/auth/sign-in?error=Unable%20to%20sign%20out', 303);
	}
};

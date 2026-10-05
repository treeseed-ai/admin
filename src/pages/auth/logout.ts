import type { APIRoute } from 'astro';
import { applicationSession } from '../../lib/auth/application-session';
import { requireCsrf } from '../../lib/auth/support/csrf';
import { pageFormFailure, pageFormResponse } from '../../lib/forms/page-submission';

export const prerender = false;
export const POST: APIRoute = async context => {
  try {
    const form = await context.request.clone().formData();
    requireCsrf(context, form.get('csrfToken'));
    const requestedReturnTo = String(form.get('returnTo') ?? '');
    const destination = new URL(requestedReturnTo || '/', context.url.origin);
    if (destination.origin !== context.url.origin) throw new Error('Invalid return destination.');
    const target = requestedReturnTo ? `/auth/sign-in?${new URLSearchParams({ returnTo: destination.pathname + destination.search, switchAccount: '1' })}` : '/';
    const logout = await (await applicationSession(context)).logout(context.request);
    const response = pageFormResponse(context, { ok: true, code: 'signed_out', message: 'You have been signed out of this application.', redirect: target }, target);
    for (const cookie of logout.headers.getSetCookie()) response.headers.append('set-cookie', cookie);
    return response;
  } catch { return pageFormFailure(context, 'Unable to sign out. Please try again.', '/app/'); }
};

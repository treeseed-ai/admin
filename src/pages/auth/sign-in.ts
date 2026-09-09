import type { APIRoute } from 'astro';
import { applicationSession } from '../../lib/auth/application-session';
import { normalizeReturnTo } from '../../lib/auth/support/flow';

export const prerender = false;
export const GET: APIRoute = async context => {
  try { return await (await applicationSession(context)).login(context.request, normalizeReturnTo(context), { promptForLogin: context.url.searchParams.get('switchAccount') === '1' }); }
  catch { return new Response('Sign-in is temporarily unavailable. Please try again.', { status: 503, headers: { 'cache-control': 'no-store' } }); }
};

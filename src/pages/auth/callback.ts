import type { APIRoute } from 'astro';
import { applicationSession, applicationRequest } from '../../lib/auth/application-session';

export const prerender = false;
export const GET: APIRoute = async context => {
  try { return await (await applicationSession(context)).callback(applicationRequest(context)); }
  catch { return new Response('Sign-in could not be completed. Start sign-in again.', { status: 400, headers: { 'cache-control': 'no-store' } }); }
};

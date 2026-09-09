import type { APIContext } from 'astro';

export function normalizeReturnTo(context: Pick<APIContext, 'url'>) {
  const value = context.url.searchParams.get('returnTo') ?? context.url.searchParams.get('next') ?? '/app/';
  const resolved = new URL(value, context.url.origin);
  return resolved.origin === context.url.origin ? resolved.pathname + resolved.search : '/app/';
}

export function redirectAuthenticatedToApp(context: Pick<APIContext, 'locals'> & { redirect: (path: string, status?: 302) => Response }) {
  return context.locals.auth?.principal ? context.redirect('/app/', 302) : null;
}

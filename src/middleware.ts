import { defineMiddleware } from 'astro:middleware';
import { resolveEditorialPreview } from '@treeseed/core/middleware/editorial-preview';
import { loadApiBackedWebSession } from './lib/auth/session-refresh';
import { ensureLocalCloudflareRuntime } from './lib/runtime/local-cloudflare';
import { authenticatedAuthRedirect } from './lib/auth/support/access-policy';

const PUBLIC_ROUTE_PREFIXES = [
	'/auth/',
	'/u/',
	'/t/',
	'/team-invites/',
	'/agents',
	'/books',
	'/contact',
	'/decisions',
	'/notes',
	'/objectives',
	'/people',
	'/proposals',
	'/questions',
	'/ui',
	'/v1/',
	'/_astro/',
];
const PUBLIC_FILE_EXTENSIONS = [
	'.css',
	'.js',
	'.mjs',
	'.map',
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.svg',
	'.ico',
	'.webp',
	'.avif',
	'.woff',
	'.woff2',
	'.ttf',
	'.json',
	'.txt',
	'.xml',
];

function isPublicRoute(pathname: string) {
	if (pathname === '/app' || pathname.startsWith('/app/')) return false;
	if (pathname === '/' || pathname === '/favicon.svg' || pathname === '/logo.svg' || pathname === '/robots.txt') return true;
	if (PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix))) return true;
	if (PUBLIC_FILE_EXTENSIONS.some((extension) => pathname.endsWith(extension))) return true;
	return true;
}

function authRedirectFor(context: any) {
	if (context.locals.auth?.principal) {
		const username = String(context.locals.auth.principal.metadata?.username ?? '').trim();
		const anonymousAuthRedirect = authenticatedAuthRedirect(context.url.pathname, Boolean(username));
		if (anonymousAuthRedirect) {
			const status = ['GET', 'HEAD'].includes(context.request.method.toUpperCase()) ? 302 : 303;
			return context.redirect(anonymousAuthRedirect, status);
		}
		if (!username && !isPublicRoute(context.url.pathname) && context.url.pathname !== '/auth/username') {
			const returnTo = `${context.url.pathname}${context.url.search}`;
			return context.redirect(`/auth/username?returnTo=${encodeURIComponent(returnTo)}`, 302);
		}
		return null;
	}
	if (isPublicRoute(context.url.pathname)) return null;
	const returnTo = `${context.url.pathname}${context.url.search}`;
	return context.redirect(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`, 302);
}

export const onRequest = defineMiddleware(async (context, next) => {
	await ensureLocalCloudflareRuntime(context.locals);
	// A fresh callback must not depend on an old or revoked application session.
	// Sign-in also remains reachable when a prior session cannot be refreshed.
	let webSession;
	try { webSession = ['/auth/sign-in', '/auth/callback'].includes(context.url.pathname) ? null : await loadApiBackedWebSession(context); }
	catch { return new Response('Account access is temporarily unavailable. Please try again.', { status: 503, headers: { 'cache-control': 'no-store' } }); }
	context.locals.auth = webSession
		? {
			session: webSession,
			principal: webSession.principal,
		}
		: null;
	const authRedirect = authRedirectFor(context);
	if (authRedirect) return authRedirect;
	resolveEditorialPreview(context);
	const response = await next();
	return response;
});

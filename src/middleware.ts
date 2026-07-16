import { defineMiddleware } from 'astro:middleware';
import { resolveEditorialPreview } from '@treeseed/core/middleware/editorial-preview';
import { getSiteAuthConfig, localAuthCanonicalRedirectUrl } from './lib/auth/config';
import { apiAccessTokenFromCookies, clearApiAccessTokenCookie, resolveApiBaseUrl } from './lib/market/api-client';
import { ensureLocalCloudflareRuntime } from './lib/runtime/local-cloudflare';

const DEV_RESET_COOKIE = 'ts_market_dev_reset';
const PUBLIC_ROUTE_PREFIXES = [
	'/auth/',
	'/u/',
	'/t/',
	'/knowledge',
	'/books',
	'/book',
	'/notes',
	'/chronicles',
	'/profiles',
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

function runtimeEnv(context: any) {
	return context.locals?.runtime?.env as Record<string, unknown> | undefined;
}

function envValue(context: any, name: string) {
	const runtimeValue = runtimeEnv(context)?.[name];
	if (typeof runtimeValue === 'string' && runtimeValue.trim()) return runtimeValue.trim();
	const processValue = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
	return typeof processValue === 'string' && processValue.trim() ? processValue.trim() : '';
}

function isPublicRoute(pathname: string) {
	if (pathname === '/' || pathname === '/favicon.svg' || pathname === '/logo.svg' || pathname === '/robots.txt') return true;
	if (PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix))) return true;
	return PUBLIC_FILE_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

function authRedirectFor(context: any) {
	if (context.locals.auth?.principal) return null;
	if (isPublicRoute(context.url.pathname)) return null;
	const returnTo = `${context.url.pathname}${context.url.search}`;
	return context.redirect(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`, 302);
}

function applyLocalDevResetCookieBoundary(context: any) {
	const resetId = envValue(context, 'TREESEED_DEV_RESET_ID');
	if (!resetId) return { changed: false, clearedAuth: false };
	const existingResetId = context.cookies.get(DEV_RESET_COOKIE)?.value;
	if (existingResetId === resetId) return { changed: false, clearedAuth: false };
	const clearedAuth = Boolean(existingResetId);
	if (clearedAuth) clearApiAccessTokenCookie(context);
	context.cookies.set(DEV_RESET_COOKIE, resetId, {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secure: context.url.protocol === 'https:',
		maxAge: 30 * 24 * 60 * 60,
	});
	return { changed: true, clearedAuth };
}

async function loadApiBackedWebSession(context: any) {
	const token = apiAccessTokenFromCookies(context);
	if (!token) return null;
	const response = await fetch(`${resolveApiBaseUrl(context.locals)}/v1/me`, {
		headers: {
			accept: 'application/json',
			authorization: `Bearer ${token}`,
		},
	}).catch(() => null);
	if (!response?.ok) return null;
	const envelope = await response.json().catch(() => null);
	const payload = envelope?.payload;
	if (!payload?.principal) return null;
	return {
		id: payload.sessionId ?? payload.principal?.metadata?.sessionId ?? 'api-session',
		userId: payload.userId ?? payload.principal.id,
		email: payload.email ?? payload.principal.email ?? null,
		displayName: payload.displayName ?? payload.principal.displayName ?? null,
		expiresAt: payload.expiresAt ?? null,
		principal: payload.principal,
	};
}

export const onRequest = defineMiddleware(async (context, next) => {
	await ensureLocalCloudflareRuntime(context.locals);
	const config = getSiteAuthConfig(context);
	const resetCookieBoundary = applyLocalDevResetCookieBoundary(context);
	const canonicalLocalUrl = localAuthCanonicalRedirectUrl(context.url, config.siteBaseUrl);
	if (canonicalLocalUrl && ['GET', 'HEAD'].includes(context.request.method.toUpperCase())) {
		const response = context.redirect(canonicalLocalUrl.toString(), 308);
		if (resetCookieBoundary.changed) {
			for (const cookie of context.cookies.headers()) {
				response.headers.append('set-cookie', cookie);
			}
		}
		return response;
	}
	const webSession = resetCookieBoundary.clearedAuth ? null : await loadApiBackedWebSession(context);
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
	if (resetCookieBoundary.changed) {
		for (const cookie of context.cookies.headers()) {
			response.headers.append('set-cookie', cookie);
		}
	}
	return response;
});

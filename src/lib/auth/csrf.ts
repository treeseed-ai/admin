import type { APIContext } from 'astro';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { WEB_CSRF_COOKIE, csrfCookieOptions } from './config';

export const WEB_CSRF_HEADER = 'x-treeseed-csrf';

export function ensureCsrfToken(context: Pick<APIContext, 'cookies' | 'url'>) {
	const existing = context.cookies.get(WEB_CSRF_COOKIE)?.value;
	if (existing) return existing;
	const token = randomBytes(32).toString('base64url');
	context.cookies.set(WEB_CSRF_COOKIE, token, csrfCookieOptions(context.url, 7 * 24 * 60 * 60));
	return token;
}

export function csrfMatches(context: Pick<APIContext, 'cookies'>, candidate: unknown) {
	const expected = context.cookies.get(WEB_CSRF_COOKIE)?.value ?? '';
	const actual = typeof candidate === 'string' ? candidate : '';
	if (!expected || !actual) return false;
	const left = Buffer.from(expected);
	const right = Buffer.from(actual);
	return left.length === right.length && timingSafeEqual(left, right);
}

export function requireCsrf(context: Pick<APIContext, 'cookies'>, candidate: unknown) {
	if (!csrfMatches(context, candidate)) throw Object.assign(new Error('The form expired. Refresh the page and try again.'), { status: 403, code: 'csrf' });
}

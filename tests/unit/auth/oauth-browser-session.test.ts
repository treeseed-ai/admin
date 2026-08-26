import { describe, expect, it } from 'vitest';
import { beginAdminAuthorization, OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, readAdminAuthorizationCookie } from '../../../src/lib/auth/oauth-browser.ts';

function context() {
	const values = new Map<string, string>();
	return {
		locals: { runtime: { env: { TREESEED_WEB_CSRF_SECRET: 'test-cookie-seal-secret' } } },
		url: new URL('https://admin.treeseed.localhost/auth/sign-in'),
		cookies: {
			get: (name: string) => values.has(name) ? { value: values.get(name)! } : undefined,
			set: (name: string, value: string) => values.set(name, value),
			delete: (name: string) => values.delete(name),
		},
		values,
	};
}

describe('Admin OAuth browser session', () => {
	it('seals PKCE, state, and same-origin return state in HttpOnly cookies', async () => {
		const request = context();
		const target = await beginAdminAuthorization(request as any, '/app/teams');
		expect(target.searchParams.get('code_challenge_method')).toBe('S256');
		expect(readAdminAuthorizationCookie(request as any, OAUTH_STATE_COOKIE)).toBe(target.searchParams.get('state'));
		expect(readAdminAuthorizationCookie(request as any, OAUTH_VERIFIER_COOKIE).length).toBeGreaterThan(40);
		expect(readAdminAuthorizationCookie(request as any, OAUTH_RETURN_COOKIE)).toBe('/app/teams');
		expect(request.values.get(OAUTH_STATE_COOKIE)).not.toBe(target.searchParams.get('state'));
	});

	it('rejects a modified sealed cookie and unsafe return path', async () => {
		const request = context();
		await beginAdminAuthorization(request as any, '//attacker.example');
		request.values.set(OAUTH_STATE_COOKIE, `${request.values.get(OAUTH_STATE_COOKIE)}tampered`);
		expect(readAdminAuthorizationCookie(request as any, OAUTH_STATE_COOKIE)).toBe('');
		expect(readAdminAuthorizationCookie(request as any, OAUTH_RETURN_COOKIE)).toBe('/app/');
	});
});

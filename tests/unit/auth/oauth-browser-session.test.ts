import { describe, expect, it } from 'vitest';
import { beginAdminAuthorization, completeAdminCredentialAuthorization, OAUTH_RETURN_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, readAdminAuthorizationCookie } from '../../../src/lib/auth/oauth-browser.ts';

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
		expect(target.searchParams.get('scope')).toBe('treeseed:read treeseed:projects:write');
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

	it('uses the configured external origin behind a TLS-terminating edge', async () => {
		const request = context();
		request.url = new URL('http://admin-live:4322/auth/sign-in');
		(request.locals.runtime.env as Record<string, string>).TREESEED_SITE_URL = 'https://admin.treeseed.localhost';
		const target = await beginAdminAuthorization(request as any, '/app/');
		expect(target.origin).toBe('https://admin.treeseed.localhost');
		expect(target.searchParams.get('redirect_uri')).toBe('https://admin.treeseed.localhost/auth/callback/treeseed');
	});

	it('uses the request loopback origin only in explicit local development mode', async () => {
		const request = context();
		request.url = new URL('http://127.0.0.1:4322/auth/sign-in');
		Object.assign(request.locals.runtime.env, {
			TREESEED_SITE_URL: 'https://admin.treeseed.localhost',
			TREESEED_DEVELOPMENT_MODE: 'live',
		});
		const target = await beginAdminAuthorization(request as any, '/app/');
		expect(target.origin).toBe('http://127.0.0.1:4322');
		expect(target.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:4322/auth/callback/treeseed');
	});

	it('completes the exact first-party credential transaction without a visible consent hop', async () => {
		const request = context();
		const originalFetch = globalThis.fetch;
		const requests: Array<{ url: string; body: string }> = [];
		globalThis.fetch = async (input, init) => {
			const url = String(input);
			requests.push({ url, body: String(init?.body ?? '') });
			if (url.includes('/oauth/authorize?')) {
				const query = new URL(url).searchParams;
				return Response.json({ clientId: query.get('client_id'), redirectUri: query.get('redirect_uri'),
					responseType: query.get('response_type'), codeChallenge: query.get('code_challenge'),
					codeChallengeMethod: query.get('code_challenge_method'), scopes: query.get('scope')?.split(' '), state: query.get('state') });
			}
			const state = new URLSearchParams(String(init?.body)).get('state');
			return Response.json({ redirectTo: `https://admin.treeseed.localhost/auth/callback/treeseed?code=code-a&state=${state}` });
		};
		try {
			const callback = await completeAdminCredentialAuthorization(request as any, { identifier: 'operator@example.com', password: 'secret' }, '/auth/device/approve?user_code=ABCD-EFGH');
			expect(callback.pathname).toBe('/auth/callback/treeseed');
			expect(readAdminAuthorizationCookie(request as any, OAUTH_RETURN_COOKIE)).toBe('/auth/device/approve?user_code=ABCD-EFGH');
			expect(requests).toHaveLength(2);
			expect(requests[1]?.body).toContain('client_id=treeseed-admin');
			expect(requests[1]?.body).toContain('decision=approve');
			expect(requests[1]?.body).toContain('identifier=operator%40example.com');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_REFRESH_COOKIE, API_SESSION_COOKIE } from '../../src/lib/market/api-client.js';
import { loadApiBackedWebSession } from '../../src/lib/auth/session-refresh.js';

function context(values: Record<string, string>) {
	const written = new Map<string, string>();
	const deleted: string[] = [];
	return {
		value: {
			locals: { runtime: { env: { TREESEED_API_BASE_URL: 'https://api.test' } } },
			url: new URL('https://admin.test/app'),
			cookies: {
				get: (name: string) => values[name] ? { value: values[name] } : undefined,
				set: (name: string, value: string) => written.set(name, value),
				delete: (name: string) => deleted.push(name),
			},
		},
		written,
		deleted,
	};
}

afterEach(() => vi.unstubAllGlobals());

describe('Admin browser session refresh', () => {
	it('rotates the refresh token when the expired access cookie is already absent', async () => {
		const test = context({ [API_REFRESH_COOKIE]: 'refresh-one' });
		const fetch = vi.fn()
			.mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access-two', refresh_token: 'refresh-two', expires_in: 900 }), { status: 200 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ data: { sessionId: 'session-two', principal: { id: 'user-one' } } }), { status: 200 }));
		vi.stubGlobal('fetch', fetch);

		const session = await loadApiBackedWebSession(test.value as any);

		expect(fetch.mock.calls.map(([url]) => String(url))).toEqual(['https://api.test/oauth/token', 'https://api.test/v1/me']);
		expect(test.written.get(API_SESSION_COOKIE)).toBe('access-two');
		expect(test.written.get(API_REFRESH_COOKIE)).toBe('refresh-two');
		expect(session).toMatchObject({ id: 'session-two', userId: 'user-one' });
	});

	it('clears both credentials when a missing-access refresh is rejected', async () => {
		const test = context({ [API_REFRESH_COOKIE]: 'replayed-refresh' });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })));

		expect(await loadApiBackedWebSession(test.value as any)).toBeNull();
		expect(test.deleted).toEqual([API_SESSION_COOKIE, API_REFRESH_COOKIE]);
	});
});

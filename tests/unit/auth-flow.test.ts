import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApiJsonHeaders, submitMarketEmailAuthFlow } from '../../src/lib/auth/support/flow.ts';

afterEach(() => vi.restoreAllMocks());

describe('browser auth request headers', () => {
	it('attaches an explicit idempotency key only when the catalog operation requires one', () => {
		const context = { request: new Request('https://admin.treeseed.localhost/auth/register') } as any;
		expect(authApiJsonHeaders(context).has('idempotency-key')).toBe(false);
		expect(authApiJsonHeaders(context, { idempotencyKey: 'registration-attempt' }).get('idempotency-key')).toBe('registration-attempt');
	});

	it('accepts the canonical API data envelope for confirmation-required signup', async () => {
		const request = new Request('https://admin.treeseed.localhost/auth/register', { headers: { 'user-agent': 'test' } });
		const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
			data: { ok: true, confirmationRequired: true, email: 'new@treeseed.local', expiresInSeconds: 3600 },
		}), { status: 200, headers: { 'content-type': 'application/json' } }));
		const result = await submitMarketEmailAuthFlow({ request, url: new URL(request.url), locals: {}, cookies: {} as any }, 'sign-up/email', {
			email: 'new@treeseed.local', password: 'TreeSeedReviewPass123!',
		});
		expect(result).toMatchObject({ ok: true, confirmationRequired: true });
		const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
		expect(headers.get('idempotency-key')).toBeTruthy();
	});
});

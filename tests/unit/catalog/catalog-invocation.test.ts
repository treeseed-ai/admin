import { describe, expect, it, vi } from 'vitest';
import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import { catalogOperationPath, invokeMethod, requestMethod } from '../../../src/lib/market/api-client/support/contracts/request.ts';
import { unwrapEnvelope } from '../../../src/lib/market/api-client.ts';
import type {ApiClientFacade} from '../../../src/lib/market/api-client.ts';
import {listProviderAvailabilitySessionsMethod} from '../../../src/lib/market/api-client/capacity/providers/queries/list-provider-availability-sessions.ts';

describe('Admin catalog invocation boundary', () => {
	it('preserves canonical provider pages and encoded team/filter scope without projecting another inventory',async()=>{
		const page={items:[{id:'session',status:'open'}],page:{hasMore:false,nextCursor:null}};
		const request=vi.fn().mockResolvedValue(page),api={request,invoke:invokeMethod} as unknown as ApiClientFacade;
		expect(await listProviderAvailabilitySessionsMethod.call(api,'team/one',{providerId:'provider one',status:'open'})).toBe(page);
		expect(request).toHaveBeenLastCalledWith('GET','/v1/teams/team%2Fone/capacity/availability-sessions?providerId=provider+one&status=open',{body:undefined});
		await listProviderAvailabilitySessionsMethod.call(api,'team/one',{providerId:null,status:null});
		expect(request).toHaveBeenLastCalledWith('GET','/v1/teams/team%2Fone/capacity/availability-sessions',{body:undefined});
	});
	it('rejects missing provider team authority before a request and retains the original upstream error',async()=>{
		const request=vi.fn().mockResolvedValue({}),api={request,invoke:invokeMethod} as unknown as ApiClientFacade;
		await expect(listProviderAvailabilitySessionsMethod.call(api,'')).rejects.toThrow();
		expect(request).not.toHaveBeenCalled();
		const denied=Object.assign(new Error('Provider observations unavailable.'),{status:503});
		request.mockRejectedValueOnce(denied);
		await expect(listProviderAvailabilitySessionsMethod.call(api,'team')).rejects.toBe(denied);
	});
	it('resolves authoritative path/query descriptors and preserves concurrency headers', async () => {
		const request = vi.fn().mockResolvedValue({ ok: true });
		const result = await invokeMethod.call({ request } as any, CONTROL_PLANE_OPERATIONS.teams.update, {
			path: { teamId: 'team/one' }, query: {}, body: { name: 'TreeSeed' },
		}, { ifMatch: '"version-3"', idempotencyKey: 'mutation-1' });
		expect(result).toEqual({ ok: true });
		expect(request).toHaveBeenCalledWith('PATCH', '/v1/teams/team%2Fone', {
			ifMatch: '"version-3"', idempotencyKey: 'mutation-1', body: { name: 'TreeSeed' },
		});
	});

	it('rejects descriptor copies that are not the authoritative SDK binding', async () => {
		const copy = { ...CONTROL_PLANE_OPERATIONS.teams.list };
		await expect(invokeMethod.call({ request: vi.fn() } as any, copy as any, {
			path: {}, query: {}, body: undefined,
		})).rejects.toThrow('not the authoritative SDK catalog binding');
	});

	it('derives idempotency from an authoritative descriptor when the caller omits it', async () => {
		const request = vi.fn().mockResolvedValue({ confirmed: true });
		await invokeMethod.call({ request } as any, CONTROL_PLANE_OPERATIONS.accounts.confirmEmail, {
			path: {}, query: {}, body: { token: 'confirmation-token' },
		});
		expect(request.mock.calls[0]?.[2]?.idempotencyKey).toBeTruthy();
	});

	it('replays an explicitly invoked high-risk operation with the API-signed confirmation state', async () => {
		const confirmation = { schemaVersion: 'treeseed.confirmation-state/v1', nonce: 'nonce', signature: 'signature' };
		const required = Object.assign(new Error('Confirmation required'), { status: 409, details: { inputRequired: { confirmation } } });
		const request = vi.fn().mockRejectedValueOnce(required).mockResolvedValueOnce({ status: 'revoked' });

		await invokeMethod.call({ request } as any, CONTROL_PLANE_OPERATIONS.accounts.revokeSession, {
			path: { sessionId: 'session-1' }, query: {}, body: {},
		});

		expect(request).toHaveBeenCalledTimes(2);
		const retryHeaders = new Headers(request.mock.calls[1]?.[2]?.headers);
		expect(JSON.parse(Buffer.from(retryHeaders.get('x-treeseed-confirmation')!, 'base64url').toString('utf8'))).toEqual(confirmation);
	});

	it('builds enhanced-form actions from authoritative descriptors', () => {
		expect(catalogOperationPath(
			CONTROL_PLANE_OPERATIONS.teams.removeMember,
			{ teamId: 'team/one', membershipId: 'member two' },
			{},
		)).toBe('/v1/teams/team%2Fone/members/member%20two');
	});

	it('unwraps canonical catalog response envelopes', () => {
		expect(unwrapEnvelope({ data: { id: 'account-1' }, meta: { etag: 'v1' } })).toEqual({ id: 'account-1' });
	});

	it('preserves RFC problem details for actionable concurrency feedback', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
			code: 'stale', detail: 'The team changed since this page loaded.',
		}), { status: 409, headers: { 'content-type': 'application/problem+json' } })));
		await expect(requestMethod.call({
			headers: () => new Headers(),
			url: (path: string) => new URL(path, 'https://api.treeseed.localhost'),
		} as any, 'PATCH', '/v1/teams/team-1', { body: {} })).rejects.toThrow('The team changed since this page loaded.');
		vi.unstubAllGlobals();
	});
});

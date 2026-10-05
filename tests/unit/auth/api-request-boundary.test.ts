import { afterEach, describe, expect, it, vi } from 'vitest';
import { urlMethod } from '../../../src/lib/market/api-client/support/contracts/url';
import { requestMethod } from '../../../src/lib/market/api-client/support/contracts/request';

function facade() {
  return { context: { locals: { runtime: { env: { TREESEED_API_BASE_URL: 'https://api.test/control' } } } },
    headers: () => new Headers({ authorization: 'Bearer server-only' }),
    url: (path: string) => `https://api.test/control${path}` } as any;
}
afterEach(() => vi.unstubAllGlobals());
describe('resource-bound API requests', () => {
  it('permits relative operations only within the configured API resource', () => {
    expect(urlMethod.call(facade(), '/v1/me')).toBe('https://api.test/control/v1/me');
    for (const path of ['https://other.test/v1/me', '//other.test', '/../outside', '/%2e%2e/outside', '/v1/me#fragment'])
      expect(() => urlMethod.call(facade(), path)).toThrow();
  });
  it.each(['Authorization', 'Cookie', 'Host', 'X-Treeseed-User-Assertion', 'X-Treeseed-Service-Key'])('rejects caller credential header %s before transport', async name => {
    const transport = vi.fn(); vi.stubGlobal('fetch', transport);
    await expect(requestMethod.call(facade(), 'GET', '/v1/me', { headers: { [name]: 'untrusted' } })).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it('retains concurrency metadata but disallows credential-bearing redirects and cookie inheritance', async () => {
    const transport = vi.fn().mockResolvedValue(Response.json({ ok: true, result: {} })); vi.stubGlobal('fetch', transport);
    await requestMethod.call(facade(), 'POST', '/v1/me', { body: {}, ifMatch: '1', idempotencyKey: 'fixture' });
    const options = transport.mock.calls[0][1];
    expect(options).toMatchObject({ redirect: 'error', credentials: 'omit' });
    expect(options.headers.get('authorization')).toBe('Bearer server-only');
    expect(options.headers.get('if-match')).toBe('1');
    expect(options.headers.get('idempotency-key')).toBe('fixture');
  });
});

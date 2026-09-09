import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const bridge = vi.hoisted(() => ({ session: vi.fn(), set: vi.fn() }));
vi.mock('../../src/lib/auth/application-session', () => ({
  applicationSession: async () => ({ session: bridge.session }), apiResource: () => 'https://api.test', setRequestCredential: bridge.set,
}));
import { loadApiBackedWebSession } from '../../src/lib/auth/session-refresh';
function context(cookie = '__Host-treeseed-admin=opaque-handle') {
  return { locals: {}, request: new Request('https://admin.test/app', { headers: { cookie } }) } as any;
}
const credential = { accessToken: 'server-only-token', resource: 'https://api.test', expiresAt: Date.now() + 60000, principal: { principalId: 'preserved' } };
beforeEach(() => { bridge.session.mockReset().mockResolvedValue(credential); bridge.set.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
describe('Admin opaque Identity session', () => {
  it('obtains API authority server-side without serializing token material', async () => {
    const request = context(), fetch = vi.fn().mockResolvedValue(Response.json({ data: { principal: { id: 'preserved' } } }));
    vi.stubGlobal('fetch', fetch);
    const session = await loadApiBackedWebSession(request);
    expect(session?.userId).toBe('preserved');
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.test/v1/me');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit', redirect: 'error', headers: { authorization: 'Bearer server-only-token' } });
    expect(bridge.set).toHaveBeenCalledWith(request, credential);
    expect(JSON.stringify({ session, locals: request.locals })).not.toContain('server-only-token');
  });
  it('does not accept retired token cookies', async () => {
    expect(await loadApiBackedWebSession(context('ts_market_api_access=old; ts_market_api_refresh=old'))).toBeNull();
    expect(bridge.session).not.toHaveBeenCalled();
  });
  it('rejects changed local principal mappings without installing a credential', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: { principal: { id: 'different' } } })));
    await expect(loadApiBackedWebSession(context())).rejects.toThrow('does not match');
    expect(bridge.set).not.toHaveBeenCalled();
  });
  it('treats removed sessions as signed out without local refresh retries', async () => {
    bridge.session.mockResolvedValue(null);
    expect(await loadApiBackedWebSession(context())).toBeNull();
    expect(bridge.set).not.toHaveBeenCalled();
  });
});

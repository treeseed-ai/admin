import { describe, expect, it } from 'vitest';
import { apiRequestHeaders, apiResource, identityAccountUrl, setRequestCredential } from '../../../src/lib/auth/application-session';
function context(api = 'https://api.test') {
  return { locals: { runtime: { env: { TREESEED_API_BASE_URL: api, TREESEED_IDENTITY_ISSUER: 'https://identity.test/realms/local', TREESEED_IDENTITY_ACCOUNT_URL: 'https://identity.test/realms/local/account' } } }, request: new Request('https://admin.test/app') } as any;
}
describe('Admin server credential boundaries', () => {
  it('keeps credentials request-local and out of serializable locals', () => {
    const first = context(), second = context();
    setRequestCredential(first, { resource: 'https://api.test', accessToken: 'synthetic-token' });
    expect(apiRequestHeaders(first).get('authorization')).toBe('Bearer synthetic-token');
    expect(apiRequestHeaders(second).has('authorization')).toBe(false);
    expect(JSON.stringify(first.locals)).not.toContain('synthetic-token');
  });
  it('denies resource switching and independent market token crossover', () => {
    const request = context();
    expect(() => setRequestCredential(request, { resource: 'https://market.test', accessToken: 'synthetic-token' })).toThrow();
    setRequestCredential(request, { resource: 'https://api.test', accessToken: 'synthetic-token' });
    request.locals.runtime.env.TREESEED_API_BASE_URL = 'https://market.test';
    expect(() => apiRequestHeaders(request)).toThrow();
  });
  it('requires secure explicit resource and account endpoints', () => {
    expect(() => apiResource(context('http://api.test'))).toThrow();
    const request = context(); expect(identityAccountUrl(request)).toBe('https://identity.test/realms/local/account');
    request.locals.runtime.env.TREESEED_IDENTITY_ACCOUNT_URL = 'https://foreign.test/account';
    expect(() => identityAccountUrl(request)).toThrow();
  });
});

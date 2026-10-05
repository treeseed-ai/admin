import { describe, expect, it } from 'vitest';
import { normalizeReturnTo } from '../../src/lib/auth/support/flow';
describe('same-origin application destinations', () => {
  for (const destination of ['https://evil.test', '//evil.test', '\\\\evil.test']) it('rejects foreign destination ' + destination, () => {
    const url = new URL('https://admin.test/auth/sign-in'); url.searchParams.set('returnTo', destination);
    expect(normalizeReturnTo({ url })).toBe('/app/');
  });
  it('retains application paths', () => {
    const url = new URL('https://admin.test/auth/username?returnTo=%2Fapp%2Fteams');
    expect(normalizeReturnTo({ url })).toBe('/app/teams');
  });
});

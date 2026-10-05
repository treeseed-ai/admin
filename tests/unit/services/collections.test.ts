import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { loadServiceItems } from '../../../src/lib/services/collections';

describe('Services cursor page rendering boundary', () => {
  for (const operationId of ['services.connections.list', 'services.credential.authorities.list'] as const) {
    it(`${operationId}: supplies item arrays, retaining scope across pages`, async () => {
      const first = { id: 'one', credentialProfileId: 'github-repository-app', status: 'ready' };
      const second = { id: 'two' };
      const invoke = vi.fn().mockResolvedValueOnce({ items: [first], cursor: 'next' })
        .mockResolvedValueOnce({ items: [second], cursor: null });
      const path = operationId === 'services.connections.list' ? { teamId: 'team' } : { teamId: 'team', connectionId: 'connection' };
      const items = await loadServiceItems({ invoke }, operationId, path);
      expect(items.filter(item => item.id === 'one')).toEqual([first]);
      expect(items.find(item => item.credentialProfileId === 'github-repository-app')?.status).toBe('ready');
      expect(invoke.mock.calls.map(([binding, input]) => [binding.descriptor.operationId, input])).toEqual([
        [operationId, { path, query: {}, body: undefined }],
        [operationId, { path, query: { cursor: 'next' }, body: undefined }],
      ]);
      expect(await loadServiceItems({ invoke: vi.fn().mockResolvedValue({ items: [], cursor: null }) }, operationId, path)).toEqual([]);
    });
  }
  it('rejects legacy arrays, malformed pages and cursor loops instead of returning partial or empty success', async () => {
    for (const page of [[], null, {}, { items: {}, cursor: null }, { items: [null], cursor: null }, { items: [], cursor: 1 }]) {
      await expect(loadServiceItems({ invoke: vi.fn().mockResolvedValue(page) }, 'services.connections.list', { teamId: 'team' })).rejects.toThrow('Invalid service collection');
    }
    const invoke = vi.fn().mockResolvedValue({ items: [], cursor: 'same' });
    await expect(loadServiceItems({ invoke }, 'services.connections.list', { teamId: 'team' })).rejects.toThrow('Repeated');
    expect(invoke).toHaveBeenCalledTimes(2);
  });
  it('bounds pagination and propagates unavailable authority without hiding it as empty', async () => {
    const invoke = vi.fn().mockImplementation(async () => ({ items: [], cursor: String(invoke.mock.calls.length) }));
    await expect(loadServiceItems({ invoke }, 'services.connections.list', { teamId: 'team' })).rejects.toThrow('limit');
    expect(invoke).toHaveBeenCalledTimes(100);
    await expect(loadServiceItems({ invoke: vi.fn().mockRejectedValue(new Error('denied')) }, 'services.credential.authorities.list', { teamId: 'team', connectionId: 'connection' })).rejects.toThrow('denied');
  });
  it('wires both rendered routes to the tested loader inside their unavailable-state boundary', () => {
    for (const [file, operation] of [['index.astro', 'services.connections.list'], ['[connectionId].astro', 'services.credential.authorities.list']]) {
      const source = readFileSync(`src/pages/app/services/${file}`, 'utf8');
      expect(source).toContain(`await loadServiceItems(api, '${operation}'`);
      expect(source).not.toContain('api.request<any[]>');
      expect(source.indexOf('try {')).toBeLessThan(source.indexOf('await loadServiceItems'));
    }
  });
});

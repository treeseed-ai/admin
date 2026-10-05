import { describe, expect, it, vi } from 'vitest';
const { adapters } = vi.hoisted(() => ({ adapters: new Map<string, any>() }));
vi.mock('@treeseed/ui/forms/client', () => ({ registerFormAdapter(name: string, adapter: any) {
  adapters.set(name, adapter); return () => adapters.delete(name);
} }));
import { initializeServiceForms } from '../../../src/lib/services/form-lifecycle';

describe('service form document lifetime', () => {
  it('retains Cloudflare request contracts after swaps and repeat visits without duplicate listeners', () => {
    const root = new EventTarget() as Document;
    const listeners = vi.spyOn(root, 'addEventListener');
    initializeServiceForms(root);
    const adapter = adapters.get('service-connection');
    for (let visit = 0; visit < 3; visit++) {
      root.dispatchEvent(new Event('astro:before-swap'));
      root.dispatchEvent(new Event('astro:page-load'));
      initializeServiceForms(root);
      expect(adapters.get('service-connection')).toBe(adapter);
      for (const method of ['', 'PUT']) {
        const formData = new FormData();
        for (const [key, value] of Object.entries({ providerId: 'cloudflare', displayName: 'storage',
          capabilities: 'object-storage', 'config.accountId': 'fixture-account', version: '2', csrfToken: 'fixture' }))
          formData.set(key, value);
        const request = adapter.buildRequest({ formData, form: { action: '/v1/teams/test/services', dataset: { tsMethod: method } } });
        const headers = new Headers(request.init.headers);
        expect(headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
        expect(headers.get('If-Match')).toBe(method ? '2' : null);
        expect(headers.get('x-treeseed-csrf')).toBe('fixture');
        expect(JSON.parse(request.init.body)).toMatchObject({ nonSecretConfig: { accountId: 'fixture-account' },
          capabilities: [{ capabilityType: 'object-storage' }] });
      }
    }
    expect(listeners.mock.calls.filter(([name]) => name === 'treeseed:form-success')).toHaveLength(1);
  });
});

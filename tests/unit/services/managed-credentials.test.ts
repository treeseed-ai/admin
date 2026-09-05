import { describe, expect, it, vi } from 'vitest';
const adapters = vi.hoisted(() => new Map<string, any>());
vi.mock('@treeseed/ui/forms/client', () => ({registerFormAdapter: (name:string, adapter:any) => {
  adapters.set(name,adapter); return () => adapters.delete(name);
}}));
import { registerServiceFormAdapters } from '../../../src/lib/services/form-adapters';
describe('managed credentials form boundary', () => {
  it('sends CAS credentials to the same-origin API, clears inputs and retains no browser vault keys', () => {
    const dispose=registerServiceFormAdapters(), formData=new FormData();
    formData.set('expectedVersion','3'); formData.set('csrfToken','synthetic-csrf');
    formData.set('secret.apiToken',' synthetic-token '); formData.set('secret.optional','');
    const input={value:' synthetic-token '};
    const request=adapters.get('managed-credentials').buildRequest({formData,form:{
      action:'https://local.example/v1/teams/team/services/connection/credentials/profile',
      dataset:{tsMethod:'PUT'},querySelectorAll:()=>[input],
    }});
    expect(request.init.method).toBe('PUT');
    expect(JSON.parse(request.init.body)).toEqual({expectedVersion:3,values:{apiToken:' synthetic-token '}});
    expect(request.init.headers['x-treeseed-csrf']).toBe('synthetic-csrf');
    expect(request.init.headers['Idempotency-Key']).toMatch(/^[a-f0-9-]{36}$/);
    expect(input.value).toBe(''); dispose();
  });
  it('delete and validate send version only', () => {
    const dispose=registerServiceFormAdapters();
    for(const method of ['DELETE','POST']) {
      const formData=new FormData(); formData.set('expectedVersion','4'); formData.set('secret.apiToken','unused');
      const request=adapters.get('managed-credentials').buildRequest({formData,form:{action:'/credentials',dataset:{tsMethod:method},querySelectorAll:()=>[]}});
      expect(JSON.parse(request.init.body)).toEqual({expectedVersion:4});
    }
    dispose();
  });
});

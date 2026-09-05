import {beforeEach, describe, expect, it, vi} from 'vitest';
const {adapters} = vi.hoisted(() => ({adapters: new Map<string, any>()}));
vi.mock('@treeseed/ui/forms/client', () => ({registerFormAdapter: (name: string, adapter: any) => {
  adapters.set(name, adapter); return () => adapters.delete(name);
}}));
import {registerServiceFormAdapters} from '../../../src/lib/services/form-adapters';
function context(method = '') {
  const formData = new FormData();
  for (const [key, value] of Object.entries({csrfToken: 'fixture', providerId: 'github', displayName: 'source', version: '3',
    capabilities: 'repository-hosting', githubAuthMethod: 'token', 'config.organization': 'example'})) formData.set(key, value);
  return {formData, form: {action: '/v1/teams/test/services/connection', dataset: {tsMethod: method}}};
}
describe('guided service forms', () => {
  beforeEach(() => {adapters.clear(); registerServiceFormAdapters();});
  it('retains selected authority, team path, CSRF and optimistic version', () => {
    const request = adapters.get('service-connection').buildRequest(context('PUT'));
    expect(request.url).toBe('/v1/teams/test/services/connection');
    expect(request.init.headers['x-treeseed-csrf']).toBe('fixture');
    expect(JSON.parse(request.init.body)).toMatchObject({version: 3, capabilities: [{credentialProfileId: 'github-repository-token'}]});
  });
  it.each(['app', 'token'])('maps one %s choice to all tasks and both environment capabilities', method => {
    const ctx = context(); ctx.formData.set('githubAuthMethod', method);
    ctx.formData.append('capabilities', 'workflow-execution');
    ctx.formData.append('capabilities', 'workflow-configuration');
    ctx.formData.set('combinedWorkflowEnvironment', 'true');
    const body = JSON.parse(adapters.get('service-connection').buildRequest(ctx).init.body);
    expect(body.capabilities).toEqual([
      {capabilityType: 'repository-hosting', status: 'configured', credentialProfileId: 'github-repository-' + method},
      ...['workflow-execution', 'workflow-configuration', 'secret-enclave'].map(capabilityType => ({capabilityType, status: 'configured', credentialProfileId: 'github-workflow-' + method})),
    ]);
  });
  it('requires an explicit method when saved GitHub methods conflict', () => {
    const ctx = context(); ctx.formData.delete('githubAuthMethod');
    expect(() => adapters.get('service-connection').buildRequest(ctx)).toThrow('Choose how to connect');
  });
  it('requires a task before creating a connection', () => {
    const ctx = context(); ctx.formData.delete('capabilities');
    expect(() => adapters.get('service-connection').buildRequest(ctx)).toThrow('Choose at least one task');
  });
  it('continues creation directly to the newly created connection', async () => {
    const result = await adapters.get('service-connection').parseResponse(Response.json({data: {id: 'new-connection'}}), context());
    expect(result).toMatchObject({ok: true, redirect: '/app/services/new-connection'});
  });
  it('does not redirect errors or edits', async () => {
    const adapter = adapters.get('service-connection');
    expect(await adapter.parseResponse(Response.json({detail: 'Version changed'}, {status: 409}), context())).toMatchObject({ok: false, message: 'Version changed', redirect: undefined});
    expect(await adapter.parseResponse(Response.json({data: {id: 'existing'}}), context('PUT'))).toMatchObject({ok: true, redirect: undefined});
    expect(await adapter.parseResponse(new Response('<html>error</html>'), context())).toMatchObject({ok: false});
  });
});

import {describe, expect, it} from 'vitest';
import {SERVICE_PROVIDER_CATALOG, getServiceProviderDefinition} from '@treeseed/sdk/secrets-capability';
import {serviceSetup} from '../../../src/lib/services/setup';
describe('service setup presentation', () => {
  for (const provider of SERVICE_PROVIDER_CATALOG) {
    for (const task of provider.capabilities.filter(task => task.status === 'available')) {
      for (const profileId of task.credentialProfileIds) {
        it(provider.id + '/' + task.type + '/' + profileId + ' shows only its selected method', () => {
          const model = serviceSetup(provider, [{capabilityType: task.type, credentialProfileId: profileId, status: 'configured'}]);
          expect(model.selectedProfiles.map(profile => profile.id)).toEqual([profileId]);
          expect(model.taskOptions.filter(task => task.checked).map(task => task.type)).toEqual([task.type]);
        });
      }
    }
  }
  it('deduplicates shared workflow credentials and ignores disabled tasks', () => {
    const model = serviceSetup(getServiceProviderDefinition('github'), [
      {capabilityType: 'workflow-execution', credentialProfileId: 'github-workflow-token', status: 'configured'},
      {capabilityType: 'workflow-configuration', credentialProfileId: 'github-workflow-token', status: 'configured'},
      {capabilityType: 'repository-hosting', credentialProfileId: 'github-repository-app', status: 'disabled'},
    ]);
    expect(model.selectedProfiles.map(profile => profile.id)).toEqual(['github-workflow-token']);
  });
  it('does not imply credentials exist for an empty connection', () => {
    expect(serviceSetup(getServiceProviderDefinition('github')).selectedProfiles).toEqual([]);
  });
});

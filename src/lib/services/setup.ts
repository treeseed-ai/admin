import type {getServiceProviderDefinition} from '@treeseed/sdk/secrets-capability';
type Provider = NonNullable<ReturnType<typeof getServiceProviderDefinition>>;
type Binding = {capabilityType: string; status: string; credentialProfileId?: string | null};
/** Present only saved, enabled authority. Selecting tasks never creates a grant. */
export function serviceSetup(provider: Provider | null | undefined, bindings: Binding[] = []) {
  const enabled = bindings.filter(binding => binding.status === 'configured');
  const selectedProfiles = provider?.credentialProfiles.filter(profile => enabled.some(binding => binding.credentialProfileId === profile.id)) ?? [];
  const taskOptions = provider?.capabilities.map(item => ({...item,
    checked: enabled.some(binding => binding.capabilityType === item.type),
    credentialProfileId: bindings.find(binding => binding.capabilityType === item.type)?.credentialProfileId,
    credentialProfiles: item.credentialProfileIds.map(id => ({id, label: provider.credentialProfiles.find(profile => profile.id === id)?.label ?? id})),
  })) ?? [];
  return {selectedProfiles, taskOptions};
}

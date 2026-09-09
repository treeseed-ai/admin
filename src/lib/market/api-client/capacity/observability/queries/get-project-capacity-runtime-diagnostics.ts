import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../../api-client.ts';
export function getProjectCapacityRuntimeDiagnosticsMethod(this: ApiClientFacade, projectId: string, teamId: string) {
    const query = new URLSearchParams({ teamId });
    return this.request<any>('GET', `/v1/projects/${encodeURIComponent(projectId)}/capacity-runtime-diagnostics?${query}`);
}

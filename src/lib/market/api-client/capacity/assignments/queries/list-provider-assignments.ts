import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../../api-client.ts';
export function listProviderAssignmentsMethod(this: ApiClientFacade, teamId: string, filters: {
    projectId?: string | null;
    providerId?: string | null;
    status?: string | null;
} = {}) {
    const query = new URLSearchParams();
    if (filters.projectId)
        query.set('projectId', filters.projectId);
    if (filters.providerId)
        query.set('providerId', filters.providerId);
    if (filters.status)
        query.set('status', filters.status);
    return this.request<any[]>('GET', `/v1/teams/${encodeURIComponent(teamId)}/capacity/assignments${query.toString() ? `?${query}` : ''}`);
}

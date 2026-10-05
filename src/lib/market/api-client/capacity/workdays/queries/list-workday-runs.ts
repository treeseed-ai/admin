import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../../api-client.ts';
export function listWorkdayRunsMethod(this: ApiClientFacade, teamId: string, filters: {
    status?: string | null;
    providerId?: string | null;
} = {}) {
    const query = new URLSearchParams();
    if (filters.status)
        query.set('status', filters.status);
    if (filters.providerId)
        query.set('providerId', filters.providerId);
    return this.request<any[]>('GET', `/v1/teams/${encodeURIComponent(teamId)}/workday-runs${query.toString() ? `?${query}` : ''}`);
}

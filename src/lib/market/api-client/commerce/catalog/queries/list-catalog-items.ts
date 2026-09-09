import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../../api-client.ts';
export function listCatalogItemsMethod(this: ApiClientFacade, _principal: unknown, filters: {
    kind?: string;
    teamId?: string;
    slug?: string;
} = {}) {
    const query = new URLSearchParams();
    if (filters.kind)
        query.set('kind', filters.kind);
    if (filters.teamId)
        query.set('teamId', filters.teamId);
    if (filters.slug)
        query.set('slug', filters.slug);
    return this.request<any[]>('GET', `/v1/catalog${query.toString() ? `?${query}` : ''}`);
}

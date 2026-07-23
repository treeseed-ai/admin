import type { APIContext } from 'astro';
import { TREESEED_REMOTE_CONTRACT_HEADER, TREESEED_REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/remote';
import { getSiteAuthConfig } from "../../auth/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../api-client.ts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../api-client.ts';
export function listProjectDeploymentsMethod(this: ApiClientFacade, projectId: string, filters: {
    environment?: string;
    action?: string;
    status?: string;
    limit?: number | string;
} = {}) {
    const query = new URLSearchParams();
    if (filters.environment)
        query.set('environment', filters.environment);
    if (filters.action)
        query.set('action', filters.action);
    if (filters.status)
        query.set('status', filters.status);
    if (filters.limit != null)
        query.set('limit', String(filters.limit));
    return this.request<any[]>('GET', `/v1/projects/${encodeURIComponent(projectId)}/deployments${query.toString() ? `?${query}` : ''}`);
}

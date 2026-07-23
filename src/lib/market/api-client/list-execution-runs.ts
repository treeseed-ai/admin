import type { APIContext } from 'astro';
import { TREESEED_REMOTE_CONTRACT_HEADER, TREESEED_REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/remote';
import { getSiteAuthConfig } from "../../auth/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../api-client.ts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../api-client.ts';
export function listExecutionRunsMethod(this: ApiClientFacade, teamId: string, filters: {
    projectId?: string | null;
    providerId?: string | null;
    status?: string | null;
    mode?: string | null;
    assignmentId?: string | null;
    workdayId?: string | null;
    limit?: number | null;
} = {}) {
    const query = new URLSearchParams();
    if (filters.projectId)
        query.set('projectId', filters.projectId);
    if (filters.providerId)
        query.set('providerId', filters.providerId);
    if (filters.status)
        query.set('status', filters.status);
    if (filters.mode)
        query.set('mode', filters.mode);
    if (filters.assignmentId)
        query.set('assignmentId', filters.assignmentId);
    if (filters.workdayId)
        query.set('workdayId', filters.workdayId);
    if (filters.limit)
        query.set('limit', String(filters.limit));
    return this.request<any[]>('GET', `/v1/teams/${encodeURIComponent(teamId)}/capacity/execution-runs${query.toString() ? `?${query}` : ''}`);
}

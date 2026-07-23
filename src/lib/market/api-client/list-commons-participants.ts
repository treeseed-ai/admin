import type { APIContext } from 'astro';
import { TREESEED_REMOTE_CONTRACT_HEADER, TREESEED_REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/remote';
import { getSiteAuthConfig } from "../../auth/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../api-client.ts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../api-client.ts';
export function listCommonsParticipantsMethod(this: ApiClientFacade, filters: Record<string, unknown> = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value != null && value !== '')
            query.set(key, String(value));
    }
    const suffix = query.toString() ? `?${query}` : '';
    return this.request<any[]>('GET', `/v1/commons/participants${suffix}`);
}

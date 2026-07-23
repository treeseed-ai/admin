import type { APIContext } from 'astro';
import { TREESEED_REMOTE_CONTRACT_HEADER, TREESEED_REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/remote';
import { getSiteAuthConfig } from "../../auth/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../api-client.ts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../api-client.ts';
export async function requestMethod<T = unknown>(this: ApiClientFacade, method: string, path: string, options: {
    body?: unknown;
} = {}): Promise<T> {
    const response = await fetch(this.url(path), {
        method,
        headers: this.headers(options.body !== undefined),
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const envelope = await response.json().catch(() => null);
    if (!response.ok || envelope?.ok === false) {
        const error = new Error(envelope?.error ?? `API request failed: ${response.status}`);
        (error as any).status = response.status;
        (error as any).details = isObject(envelope) ? envelope : {};
        throw error;
    }
    return unwrapEnvelope<T>(envelope);
}

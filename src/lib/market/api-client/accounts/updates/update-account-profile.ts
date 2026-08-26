import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import { getSiteAuthConfig } from "../../../../auth/configuration/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export function updateAccountProfileMethod(this: ApiClientFacade, body: {
    firstName: string;
    lastName: string;
    image?: string | null;
    headline?: string | null;
    profileSummary?: string | null;
    location?: string | null;
    website?: string | null;
    expertise?: string[];
}) { return this.request<AccountMutationResult>('PATCH', '/v1/auth/web/profile', { body }); }

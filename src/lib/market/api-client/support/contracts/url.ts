import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export function urlMethod(this: ApiClientFacade, path: string) {
    const base = new URL(resolveApiBaseUrl(this.context.locals));
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('An API-relative path is required.');
    const target = new URL(`${base.href.replace(/\/$/u, '')}${path}`);
    if (target.origin !== base.origin || target.username || target.password || target.hash ||
        !target.pathname.startsWith(`${base.pathname.replace(/\/$/u, '')}/`)) throw new Error('API request escaped its configured resource.');
    return target.href;
}

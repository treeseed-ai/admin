import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export function listApprovalRequestsForTeamMethod(this: ApiClientFacade, teamId: string, options: {
    kind?: string;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (options.kind)
        query.set('kind', options.kind);
    query.set('limit', String(options.limit ?? 100));
    return this.request<any[]>('GET', `/v1/teams/${encodeURIComponent(teamId)}/approval-requests?${query}`);
}

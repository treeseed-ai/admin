import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../../api-client.ts';
export function listProjectAgentFallbackOutputsMethod(this: ApiClientFacade, projectId: string, filters: {
    mode?: string | null;
    status?: string | null;
    assignmentId?: string | null;
} = {}) {
    const query = new URLSearchParams();
    if (filters.mode)
        query.set('mode', filters.mode);
    if (filters.status)
        query.set('status', filters.status);
    if (filters.assignmentId)
        query.set('assignmentId', filters.assignmentId);
    return this.request<any[]>('GET', `/v1/projects/${encodeURIComponent(projectId)}/agent-fallback-outputs${query.toString() ? `?${query}` : ''}`);
}

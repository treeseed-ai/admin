import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export function recordPrivateKnowledgeOutcomeMethod(this: ApiClientFacade, projectId: string, body: {
    slug?: string;
    route?: string;
    outcome: 'read' | 'not_found';
}) {
    return this.request<any>('POST', `/v1/projects/${encodeURIComponent(projectId)}/private-knowledge/access`, { body });
}

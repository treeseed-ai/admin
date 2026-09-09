import type { APIContext } from 'astro';
import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export function updateNotificationPreferencesMethod(this: ApiClientFacade, body: NotificationPreferences, ifMatch: string) { return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.updateNotificationPreferences, { path: {}, query: {}, body: { ...body } }, { ifMatch }) as unknown as Promise<NotificationPreferences>; }

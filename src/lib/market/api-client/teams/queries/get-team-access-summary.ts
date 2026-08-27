import type { APIContext } from 'astro';
import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import { getSiteAuthConfig } from "../../../../auth/configuration/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export interface TeamAccessSummary {
	roles: string[];
	permissions: string[];
	team?: unknown;
	access?: { roles?: string[]; permissions?: string[]; [key: string]: unknown };
}
export async function getTeamAccessSummaryMethod(this: ApiClientFacade, teamId: string): Promise<TeamAccessSummary> {
	const result = await this.invoke(CONTROL_PLANE_OPERATIONS.teams.access, {
		path: { teamId }, query: {}, body: undefined,
	}) as unknown as { team?: unknown; access?: TeamAccessSummary['access'] };
	return {
		...(result.access ?? {}),
		team: result.team,
		access: result.access,
		roles: result.access?.roles ?? [],
		permissions: result.access?.permissions ?? [],
	};
}

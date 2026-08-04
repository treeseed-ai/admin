import type { AccountPreferences, AccountPreferencesUpdate } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function updateAccountPreferencesMethod(this: ApiClientFacade, body: AccountPreferencesUpdate) {
	return this.request<AccountPreferences>('PATCH', '/v1/auth/web/preferences', { body });
}

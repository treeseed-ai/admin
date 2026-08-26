import type { AccountPreferences, AccountPreferencesUpdate } from '@treeseed/sdk/account-contracts';
import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function updateAccountPreferencesMethod(this: ApiClientFacade, body: AccountPreferencesUpdate) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.updatePreferences, { path: {}, query: {}, body }) as unknown as Promise<AccountPreferences>;
}

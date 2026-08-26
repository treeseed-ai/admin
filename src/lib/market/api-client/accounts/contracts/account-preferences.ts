import type { AccountPreferences } from '@treeseed/sdk/account-contracts';
import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function accountPreferencesMethod(this: ApiClientFacade) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.preferences, { path: {}, query: {}, body: undefined }) as unknown as Promise<AccountPreferences>;
}

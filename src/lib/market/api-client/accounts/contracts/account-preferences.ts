import type { AccountPreferences } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function accountPreferencesMethod(this: ApiClientFacade) {
	return this.request<AccountPreferences>('GET', '/v1/auth/web/preferences');
}

import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { AccountNotification } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function accountNotificationsMethod(this: ApiClientFacade, limit = 20) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.notifications, { path: {}, query: { limit }, body: undefined })
		.then((result: any) => Array.isArray(result) ? result : result.items ?? []) as Promise<AccountNotification[]>;
}

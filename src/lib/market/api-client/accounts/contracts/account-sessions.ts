import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { AccountWebSession } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function accountSessionsMethod(this: ApiClientFacade) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.sessions, { path: {}, query: {}, body: undefined })
		.then((result: any) => Array.isArray(result) ? result : result.items ?? []) as Promise<AccountWebSession[]>;
}

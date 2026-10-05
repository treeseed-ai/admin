import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { AccountIdentity } from '@treeseed/sdk/account-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function accountIdentityMethod(this: ApiClientFacade) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.identity, { path: {}, query: {}, body: undefined }) as unknown as Promise<AccountIdentity>;
}

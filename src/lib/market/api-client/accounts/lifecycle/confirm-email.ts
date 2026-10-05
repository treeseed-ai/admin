import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function confirmEmailMethod(this: ApiClientFacade, token: string) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.confirmEmail, { path: {}, query: {}, body: { token } }) as Promise<{ confirmed: true }>;
}

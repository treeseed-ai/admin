import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';

export function requestPasswordResetMethod(this: ApiClientFacade, email: string) {
	return this.invoke(CONTROL_PLANE_OPERATIONS.accounts.requestPasswordReset, { path: {}, query: {}, body: { email } }) as Promise<{ accepted: true }>;
}

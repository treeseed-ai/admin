import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';
export function acceptTeamInviteMethod(this: ApiClientFacade, token: string, _principalId: string) {
    return this.invoke(CONTROL_PLANE_OPERATIONS.teams.inviteAccept, { path: { token }, query: {}, body: {} });
}

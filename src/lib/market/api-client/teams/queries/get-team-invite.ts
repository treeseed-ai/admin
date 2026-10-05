import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';
export function getTeamInviteMethod(this: ApiClientFacade, token: string) {
    return this.invoke(CONTROL_PLANE_OPERATIONS.teams.inviteShow, { path: { token }, query: {}, body: undefined });
}

import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';
export function listTeamMembersMethod(this: ApiClientFacade, teamId: string) {
    return this.invoke(CONTROL_PLANE_OPERATIONS.teams.members, { path: { teamId }, query: {}, body: undefined })
        .then((result: any) => Array.isArray(result) ? result : result.items ?? []) as Promise<any[]>;
}

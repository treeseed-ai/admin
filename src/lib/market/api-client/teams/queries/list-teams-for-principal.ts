import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../api-client.ts';
export function listTeamsForPrincipalMethod(this: ApiClientFacade) {
    return this.invoke(CONTROL_PLANE_OPERATIONS.teams.list, { path: {}, query: {}, body: undefined })
        .then((result: any) => Array.isArray(result) ? result : result.teams ?? []) as Promise<any[]>;
}

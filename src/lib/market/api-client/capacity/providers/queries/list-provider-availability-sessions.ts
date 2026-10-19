import { CONTROL_PLANE_OPERATIONS } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../../../../api-client.ts';

export function listProviderAvailabilitySessionsMethod(
    this: ApiClientFacade,
    teamId: string,
    filters: {
        providerId?: string | null;
        status?: string | null;
    } = {},
) {
    const query = {
        ...(filters.providerId ? { providerId: filters.providerId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
    };

    return this.invoke(CONTROL_PLANE_OPERATIONS.capacity.availability, {
        path: { teamId },
        query,
        body: undefined,
    });
}

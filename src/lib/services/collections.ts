import { controlPlaneOperation } from '@treeseed/sdk/operator-contracts';
import type { ApiClientFacade } from '../market/api-client';

type ServiceCollection = 'services.connections.list' | 'services.credential.authorities.list';

/** Service reads return cursor pages, never bare arrays. Reject incomplete reads. */
export async function loadServiceItems(api: { invoke: OmitThisParameter<ApiClientFacade['invoke']> }, operationId: ServiceCollection,
  path: { teamId: string; connectionId?: string }): Promise<any[]> {
  const operation = controlPlaneOperation(operationId);
  const items: any[] = [], seen = new Set<string>();
  let cursor: string | undefined;
  for (let count = 0; count < 100; count++) {
    const page = await api.invoke(operation, { path, query: cursor ? { cursor } : {}, body: undefined });
    if (!page || typeof page !== 'object' || !Array.isArray(page.items)
      || page.items.some((item: unknown) => !item || typeof item !== 'object' || Array.isArray(item))
      || !(page.cursor === null || typeof page.cursor === 'string' && page.cursor.length > 0)) {
      throw new Error('Invalid service collection response.');
    }
    items.push(...page.items);
    if (page.cursor === null) return items;
    if (seen.has(page.cursor)) throw new Error('Repeated service collection cursor.');
    seen.add(page.cursor); cursor = page.cursor;
  }
  throw new Error('Service collection pagination limit exceeded.');
}

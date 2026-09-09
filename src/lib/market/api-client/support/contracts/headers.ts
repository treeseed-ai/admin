import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import type { ApiClientFacade } from '../../../api-client';
import { apiRequestHeaders } from '../../../../auth/application-session';

export function headersMethod(this: ApiClientFacade, body = false) {
  const headers = apiRequestHeaders(this.context);
  headers.set(REMOTE_CONTRACT_HEADER, String(REMOTE_CONTRACT_VERSION));
  if (body) headers.set('content-type', 'application/json');
  return headers;
}

import type { APIContext } from 'astro';
import { applicationSession, apiResource, setRequestCredential } from './application-session';

export async function loadApiBackedWebSession(context: APIContext) {
  if (!(context.request.headers.get('cookie') ?? '').split(';').some(value => value.trim().startsWith('__Host-treeseed-admin='))) return null;
  const credential = await (await applicationSession(context)).session(context.request);
  if (!credential) return null;
  const response = await fetch(`${apiResource(context)}/v1/me`, {
    headers: { accept: 'application/json', authorization: `Bearer ${credential.accessToken}` },
    credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Account access is unavailable.');
  const envelope = await response.json();
  const payload = envelope?.data;
  if (!payload?.principal || payload.principal.id !== credential.principal.principalId) throw new Error('Account identity does not match this session.');
  setRequestCredential(context, credential);
  return {
    id: 'identity-browser-session', userId: payload.principal.id,
    email: payload.email ?? payload.principal.email ?? null,
    displayName: payload.displayName ?? payload.principal.displayName ?? null,
    expiresAt: new Date(credential.expiresAt).toISOString(), principal: payload.principal,
  };
}

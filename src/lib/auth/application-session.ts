import type { APIContext } from 'astro';
import { importPKCS8 } from 'jose';
import { createApplicationSession, createWorkloadCredentials, discoverResourceAuthorization, discoverSigningKeys } from '@treeseed/identity';
import { identityEndpointSchema } from '@treeseed/sdk/identity';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';

type Context = Pick<APIContext, 'locals' | 'request'>;
type Session = ReturnType<typeof createApplicationSession>;
const requestTokens = new WeakMap<object, { resource: string; accessToken: string }>();
let cached: { fingerprint: string; session: Promise<Session> } | undefined;

/** Deployment supplies this independent asymmetric workload key through its
 * protected runtime configuration. It is never a browser or vault login key. */
function setting(context: Context, name: string) {
  const env = context.locals.runtime?.env as Record<string, unknown> | undefined;
  const value = env?.[name] ?? globalThis.process?.env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function apiResource(context: Context) {
  return identityEndpointSchema.parse(setting(context, 'TREESEED_API_BASE_URL')).replace(/\/$/u, '');
}

export function identityAccountUrl(context: Context) {
  const issuer = new URL(identityEndpointSchema.parse(setting(context, 'TREESEED_IDENTITY_ISSUER')));
  const account = new URL(identityEndpointSchema.parse(setting(context, 'TREESEED_IDENTITY_ACCOUNT_URL')));
  if (account.origin !== issuer.origin) throw new Error('Identity management must use the configured authority.');
  return account.href;
}

export async function applicationSession(context: Context): Promise<Session> {
  const configuration = { resource: apiResource(context), issuer: setting(context, 'TREESEED_IDENTITY_ISSUER'),
    origin: identityEndpointSchema.parse(setting(context, 'TREESEED_SITE_URL')),
    clientId: setting(context, 'TREESEED_IDENTITY_WORKLOAD_CLIENT_ID'), key: setting(context, 'TREESEED_IDENTITY_WORKLOAD_PRIVATE_KEY') };
  if (new URL(configuration.origin).pathname !== '/' || !configuration.clientId || !configuration.key) throw new Error('Identity application configuration is required.');
  const fingerprint = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(configuration))))]
    .map(value => value.toString(16).padStart(2, '0')).join('');
  if (cached?.fingerprint === fingerprint) return cached.session;
  const session = (async () => {
    const authority = await discoverResourceAuthorization({ resource: configuration.resource,
      ...(configuration.issuer ? { issuer: configuration.issuer } : {}), transport: fetch });
    const workload = await createWorkloadCredentials({ issuer: authority.issuer, clientId: configuration.clientId,
      privateKey: await importPKCS8(configuration.key, 'RS256'), resources: [authority.resource],
      verificationKey: await discoverSigningKeys({ issuer: authority.issuer, transport: fetch }), profile: 'keycloak', transport: fetch,
      resolvePrincipal: async identity => ({ principalId: identity.subject, kind: 'service', clientId: configuration.clientId }) });
    return createApplicationSession({ issuer: authority.issuer, resource: authority.resource,
      callbackUrl: new URL('/auth/callback', configuration.origin).href, afterLogin: '/app/', cookieName: '__Host-treeseed-admin',
      credentials: { token: async request => (await workload.credentials(request)).accessToken }, transport: fetch });
  })();
  cached = { fingerprint, session };
  try { return await session; } catch { if (cached?.fingerprint === fingerprint) cached = undefined; throw new Error('Identity sign-in is unavailable.'); }
}

/** A request-local, server-only token, not a serializable Astro locals field. */
export function setRequestCredential(context: Context, value: { resource: string; accessToken: string }) {
  if (value.resource !== apiResource(context)) throw new Error('API credential resource mismatch.');
  requestTokens.set(context.locals, value);
}

export function apiRequestHeaders(context: Context) {
  const token = requestTokens.get(context.locals);
  if (token && token.resource !== apiResource(context)) throw new Error('API credential resource mismatch.');
  return new Headers({ accept: 'application/json', [REMOTE_CONTRACT_HEADER]: String(REMOTE_CONTRACT_VERSION),
    ...(token ? { authorization: `Bearer ${token.accessToken}` } : {}) });
}

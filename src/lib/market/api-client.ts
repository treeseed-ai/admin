import type { APIContext } from 'astro';
import { TREESEED_REMOTE_CONTRACT_HEADER, TREESEED_REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/remote';
import { getSiteAuthConfig } from '../auth/config';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
export type AstroLike = Pick<APIContext, 'locals' | 'cookies' | 'url' | 'request'>;
export const API_SESSION_COOKIE = 'ts_market_api_access';
export function getNodeCrypto(): {
    createHmac?: (algorithm: string, secret: string) => {
        update: (value: string) => {
            digest: (encoding: 'base64url') => string;
        };
    };
    randomUUID?: () => string;
    timingSafeEqual?: (left: Uint8Array, right: Uint8Array) => boolean;
} | null {
    return (globalThis as {
        process?: {
            getBuiltinModule?: (name: string) => unknown;
        };
    }).process
        ?.getBuiltinModule?.('crypto') as ReturnType<typeof getNodeCrypto> ?? null;
}
export function randomId() {
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto?.randomUUID)
        return nodeCrypto.randomUUID();
    if (globalThis.crypto?.randomUUID)
        return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto?.getRandomValues?.(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function runtimeEnv(locals: App.Locals | Record<string, unknown> | null | undefined) {
    return (locals as App.Locals | undefined)?.runtime?.env as Record<string, unknown> | undefined;
}
export function envValue(locals: App.Locals | Record<string, unknown> | null | undefined, name: string) {
    const runtimeValue = runtimeEnv(locals)?.[name];
    if (typeof runtimeValue === 'string' && runtimeValue.trim())
        return runtimeValue.trim();
    const processValue = (globalThis as {
        process?: {
            env?: Record<string, string | undefined>;
        };
    }).process?.env?.[name];
    return typeof processValue === 'string' && processValue.trim() ? processValue.trim() : '';
}
export function resolveApiBaseUrl(locals?: App.Locals | Record<string, unknown> | null) {
    return (envValue(locals, 'TREESEED_MARKET_API_BASE_URL')
        || envValue(locals, 'TREESEED_CENTRAL_MARKET_API_BASE_URL')
        || 'https://api.treeseed.ai').replace(/\/+$/u, '');
}
export function encodeAssertionPayload(payload: Record<string, unknown>) {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}
export function signAssertionPayload(payload: string, secret: string) {
    const nodeCrypto = getNodeCrypto();
    if (!nodeCrypto?.createHmac) {
        throw new Error('Trusted web user assertions require an HMAC-capable runtime.');
    }
    return nodeCrypto.createHmac('sha256', secret).update(payload).digest('base64url');
}
export function createTrustedWebUserAssertion(context: Pick<APIContext, 'locals' | 'url'>) {
    const principal = context.locals.auth?.principal;
    if (!principal?.id)
        return null;
    const config = getSiteAuthConfig(context);
    const session = context.locals.auth?.session;
    const payload = encodeAssertionPayload({
        userId: principal.id,
        sessionId: session?.id ?? principal.metadata?.sessionId ?? null,
        identityId: session?.identityId ?? principal.metadata?.identityId ?? null,
        authTime: session?.authenticatedAt ?? principal.metadata?.authTime ?? new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        nonce: randomId(),
    });
    return `${payload}.${signAssertionPayload(payload, config.apiAssertionSecret)}`;
}
export function apiServiceHeaders(context: Pick<APIContext, 'locals' | 'url'>, options: {
    forceService?: boolean;
    skipUserAssertion?: boolean;
} = {}) {
    const config = getSiteAuthConfig(context);
    const headers = new Headers({
        accept: 'application/json',
        [TREESEED_REMOTE_CONTRACT_HEADER]: String(TREESEED_REMOTE_CONTRACT_VERSION),
    });
    const assertion = options.skipUserAssertion ? null : createTrustedWebUserAssertion(context);
    if (assertion || options.forceService) {
        headers.set('x-treeseed-service-id', config.apiServiceId);
        headers.set('x-treeseed-service-secret', config.apiServiceSecret);
    }
    if (assertion)
        headers.set('x-treeseed-user-assertion', assertion);
    return headers;
}
export function apiAccessTokenFromCookies(context: Pick<APIContext, 'cookies'>) {
    return context.cookies.get(API_SESSION_COOKIE)?.value ?? null;
}
export function setApiAccessTokenCookie(context: Pick<APIContext, 'cookies' | 'url'>, token: string, maxAgeSeconds: number) {
    context.cookies.set(API_SESSION_COOKIE, token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: context.url.protocol === 'https:',
        maxAge: maxAgeSeconds,
    });
}
export function clearApiAccessTokenCookie(context: Pick<APIContext, 'cookies' | 'url'>) {
    context.cookies.delete(API_SESSION_COOKIE, {
        path: '/',
        secure: context.url.protocol === 'https:',
    });
}
export function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
export function unwrapEnvelope<T = unknown>(envelope: any): T {
    if (Object.prototype.hasOwnProperty.call(envelope, 'payload'))
        return envelope.payload as T;
    if (Object.prototype.hasOwnProperty.call(envelope, 'provider'))
        return envelope.provider as T;
    if (Object.prototype.hasOwnProperty.call(envelope, 'operations'))
        return envelope.operations as T;
    return envelope as T;
}
import * as extractedMethods from "./api-client/methods.ts";
import "./api-client/interface.ts";
export class ApiClientFacade {
    constructor(readonly context: AstroLike) { }
    get currentPrincipal() {
        return this.context.locals.auth?.principal ?? null;
    }
}
extractedMethods.installApiClientFacadeMethods(ApiClientFacade.prototype);
export function createApiFacade(context: AstroLike) {
    return new ApiClientFacade(context);
}
export function safeTokenEquals(left: string, right: string) {
    const encoder = new TextEncoder();
    const leftBuffer = encoder.encode(left);
    const rightBuffer = encoder.encode(right);
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto?.timingSafeEqual) {
        return leftBuffer.length === rightBuffer.length && nodeCrypto.timingSafeEqual(leftBuffer, rightBuffer);
    }
    let diff = leftBuffer.length ^ rightBuffer.length;
    const length = Math.max(leftBuffer.length, rightBuffer.length);
    for (let index = 0; index < length; index += 1) {
        diff |= (leftBuffer[index] ?? 0) ^ (rightBuffer[index] ?? 0);
    }
    return diff === 0;
}

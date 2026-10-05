import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import { identityEndpointSchema } from '@treeseed/sdk/identity';
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
export type AstroLike = Pick<APIContext, 'locals' | 'cookies' | 'url' | 'request'>;
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
    return identityEndpointSchema.parse(envValue(locals, 'TREESEED_API_BASE_URL')).replace(/\/+$/u, '');
}
export function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
export function unwrapEnvelope<T = unknown>(envelope: any): T {
	if (Object.prototype.hasOwnProperty.call(envelope, 'data'))
		return envelope.data as T;
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
export { catalogOperationPath } from "./api-client/support/contracts/request.ts";
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

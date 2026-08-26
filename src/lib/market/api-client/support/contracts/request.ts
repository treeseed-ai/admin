import type { APIContext } from 'astro';
import { REMOTE_CONTRACT_HEADER, REMOTE_CONTRACT_VERSION } from '@treeseed/sdk/site-contracts/catalog';
import { getSiteAuthConfig } from "../../../../auth/configuration/config";
import type { AccountDeletionBlocker, AccountEmailAddress, AccountEmailMutationResult, AccountIdentity, AccountMutationResult, AccountNotification, AccountWebSession, AuthProviderCapability, NotificationPreferences, NotificationProject, PersonalTheme, PersonalThemeDraft, UsernameClaimResult, WebAuthenticationResult } from '@treeseed/sdk/account-contracts';
import type { AstroLike, ApiClientFacade } from '../../../api-client.ts';
import { controlPlaneOperation, type ControlPlaneOperationBinding, type ControlPlaneOperationBody, type ControlPlaneOperationOutput, type ControlPlaneOperationPath, type ControlPlaneOperationQuery } from '@treeseed/sdk/operator-contracts';
import { API_SESSION_COOKIE, getNodeCrypto, randomId, runtimeEnv, envValue, resolveApiBaseUrl, encodeAssertionPayload, signAssertionPayload, createTrustedWebUserAssertion, apiServiceHeaders, apiAccessTokenFromCookies, setApiAccessTokenCookie, clearApiAccessTokenCookie, isObject, unwrapEnvelope, createApiFacade, safeTokenEquals } from '../../../api-client.ts';
export async function requestMethod<T = unknown>(this: ApiClientFacade, method: string, path: string, options: {
    body?: unknown;
    headers?: HeadersInit;
    idempotencyKey?: string;
    ifMatch?: string;
    signal?: AbortSignal;
} = {}): Promise<T> {
    const headers = this.headers(options.body !== undefined);
    new Headers(options.headers).forEach((value, name) => headers.set(name, value));
    if (options.idempotencyKey)
        headers.set('idempotency-key', options.idempotencyKey);
    if (options.ifMatch)
        headers.set('if-match', options.ifMatch);
    const response = await fetch(this.url(path), {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
    });
    const envelope = await response.json().catch(() => null);
    if (!response.ok || envelope?.ok === false) {
        const error = new Error(envelope?.message ?? envelope?.error ?? `API request failed: ${response.status}`);
        (error as any).status = response.status;
        (error as any).details = isObject(envelope) ? envelope : {};
        throw error;
    }
    return unwrapEnvelope<T>(envelope);
}

type OperationInput<T extends ControlPlaneOperationBinding<any, any, any, any>> = {
    path: ControlPlaneOperationPath<T>;
    query: ControlPlaneOperationQuery<T>;
    body: ControlPlaneOperationBody<T>;
};

export async function invokeMethod<T extends ControlPlaneOperationBinding<any, any, any, any>>(
    this: ApiClientFacade,
    binding: T,
    input: OperationInput<T>,
    options: { headers?: HeadersInit; idempotencyKey?: string; ifMatch?: string; signal?: AbortSignal } = {},
): Promise<ControlPlaneOperationOutput<T>> {
    const operationId = binding.descriptor.operationId;
    if (controlPlaneOperation(operationId) !== binding)
        throw new Error(`Operation ${operationId} is not the authoritative SDK catalog binding.`);
    const rest = binding.descriptor.rest;
    if (!rest)
        throw new Error(`Operation ${operationId} has no REST binding.`);
    const pathInput = binding.schema.path.parse(input.path) as Record<string, unknown>;
    const queryInput = binding.schema.query.parse(input.query) as Record<string, unknown>;
    const bodyInput = binding.schema.body.parse(input.body);
    const path = rest.path.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/gu, (_match, name: string) => {
        const value = pathInput[name];
        if (typeof value !== 'string' && typeof value !== 'number')
            throw new Error(`Operation ${operationId} requires path parameter ${name}.`);
        return encodeURIComponent(String(value));
    });
    if (path.includes('{'))
        throw new Error(`Operation ${operationId} has unresolved path parameters.`);
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries(queryInput)) {
        if (value === undefined || value === null)
            continue;
        for (const item of Array.isArray(value) ? value : [value])
            query.append(name, String(item));
    }
    const suffix = query.size ? `?${query}` : '';
    return this.request<ControlPlaneOperationOutput<T>>(rest.method, `${path}${suffix}`, {
        ...options,
        body: rest.method === 'GET' ? undefined : bodyInput,
    });
}

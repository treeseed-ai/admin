/// <reference types="astro/client" />

declare module 'astro:middleware' {
	import type { MiddlewareHandler } from 'astro';

	export function defineMiddleware(handler: MiddlewareHandler): MiddlewareHandler;
}

declare module 'cloudflare:sockets' {
	export interface Socket {
		readable: ReadableStream<Uint8Array>;
		writable: WritableStream<Uint8Array>;
		startTls?(): Socket;
	}

	export function connect(
		address: { hostname: string; port: number },
		options?: { secureTransport?: 'off' | 'on' | 'starttls' | string },
	): Socket;
}

declare namespace App {
	interface Locals {
		runtime?: import('@treeseed/sdk/types/cloudflare').CloudflareRuntime;
		contentPreview?: import('@treeseed/sdk').EditorialPreviewTokenPayload | null;
		auth?: {
			session: {
				id: string;
				userId: string;
				provider?: string | null;
				email?: string | null;
				displayName?: string | null;
				identityId?: string | null;
				authenticatedAt?: string | null;
				expiresAt?: string | null;
			};
			principal: import('@treeseed/sdk/remote').ApiPrincipal;
		} | null;
	}
}

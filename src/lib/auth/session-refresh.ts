import {
	apiAccessTokenFromCookies,
	apiRefreshTokenFromCookies,
	clearApiAccessTokenCookie,
	clearApiRefreshTokenCookie,
	resolveApiBaseUrl,
	setApiAccessTokenCookie,
	setApiRefreshTokenCookie,
} from '../market/api-client';

async function refreshApiAccessToken(context: any) {
	const refreshToken = apiRefreshTokenFromCookies(context);
	if (!refreshToken) return null;
	const refreshed = await fetch(`${resolveApiBaseUrl(context.locals)}/oauth/token`, { method: 'POST',
		headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ client_id: 'treeseed-admin', grant_type: 'refresh_token', refresh_token: refreshToken }),
	}).catch(() => null);
	const tokens = await refreshed?.json().catch(() => null);
	if (refreshed?.ok && tokens?.access_token && tokens?.refresh_token) {
		const token = String(tokens.access_token);
		setApiAccessTokenCookie(context, token, Number(tokens.expires_in ?? 900));
		setApiRefreshTokenCookie(context, tokens.refresh_token);
		return token;
	}
	clearApiAccessTokenCookie(context);
	clearApiRefreshTokenCookie(context);
	return null;
}

export async function loadApiBackedWebSession(context: any) {
	let token = apiAccessTokenFromCookies(context);
	if (!token) token = await refreshApiAccessToken(context);
	if (!token) return null;
	let response = await fetch(`${resolveApiBaseUrl(context.locals)}/v1/me`, {
		headers: { accept: 'application/json', authorization: `Bearer ${token}` },
	}).catch(() => null);
	if (response?.status === 401) {
		token = await refreshApiAccessToken(context);
		response = token ? await fetch(`${resolveApiBaseUrl(context.locals)}/v1/me`, {
			headers: { accept: 'application/json', authorization: `Bearer ${token}` },
		}).catch(() => null) : null;
	}
	if (!response?.ok) return null;
	const envelope = await response.json().catch(() => null);
	const payload = envelope?.data ?? envelope?.payload;
	if (!payload?.principal) return null;
	return {
		id: payload.sessionId ?? payload.principal?.metadata?.sessionId ?? 'api-session',
		userId: payload.userId ?? payload.principal.id,
		email: payload.email ?? payload.principal.email ?? null,
		displayName: payload.displayName ?? payload.principal.displayName ?? null,
		expiresAt: payload.expiresAt ?? null,
		principal: payload.principal,
	};
}

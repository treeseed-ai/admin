export const WEB_CSRF_COOKIE = 'ts_csrf';

export function csrfCookieOptions(requestUrl: URL, maxAge: number) {
  return { httpOnly: false, path: '/', sameSite: 'lax' as const, secure: requestUrl.protocol === 'https:', maxAge };
}

const ANONYMOUS_AUTH_ROUTES = new Set([
	'/auth/check-email',
	'/auth/forgot-password',
	'/auth/register',
	'/auth/reset-password',
	'/auth/sign-in',
]);

export function isAnonymousAuthRoute(pathname: string) {
	return ANONYMOUS_AUTH_ROUTES.has(pathname) || pathname.startsWith('/auth/callback/');
}

export function authenticatedAuthRedirect(pathname: string, hasUsername: boolean) {
	if (!isAnonymousAuthRoute(pathname)) return null;
	return hasUsername
		? '/app/'
		: `/auth/username?returnTo=${encodeURIComponent('/app/')}`;
}

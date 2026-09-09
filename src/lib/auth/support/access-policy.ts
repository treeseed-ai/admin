export function isAnonymousAuthRoute(pathname: string) {
  return pathname === '/auth/sign-in';
}

export function authenticatedAuthRedirect(pathname: string, hasUsername: boolean) {
  if (!isAnonymousAuthRoute(pathname)) return null;
  return hasUsername ? '/app/' : '/auth/username';
}

export interface PermissionPrincipal {
	roles?: readonly string[] | null;
	permissions?: readonly string[] | null;
}

/** Presentation-only permission check over API-issued principal claims. */
export function principalHasPlatformPermission(
	principal: PermissionPrincipal | null | undefined,
	permission: string,
) {
	return Boolean(
		principal
		&& (principal.roles?.includes('platform_admin')
			|| principal.permissions?.includes('*:*:*')
			|| principal.permissions?.includes(permission)),
	);
}

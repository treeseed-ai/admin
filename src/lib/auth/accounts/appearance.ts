import {
	normalizeAppearancePreference,
	normalizeThemePreference,
	type AppearancePreference,
	type ThemePreference,
} from '@treeseed/ui/theme';
import type { APIContext } from 'astro';

export const COLOR_SCHEME_COOKIE = 'treeseed_color_scheme';
export const THEME_MODE_COOKIE = 'treeseed_theme_mode';

export type AnonymousAppearanceContext = {
	url: URL;
	cookies: {
		get(name: string): { value?: string } | undefined;
		set(name: string, value: string, options: Record<string, unknown>): void;
		headers?(): Iterable<string>;
	};
};

export type AppearanceContext = AnonymousAppearanceContext & Pick<APIContext, 'locals' | 'request'>;

export function shouldReloadAppearancePage(pathname: string, persisted: boolean) {
	return persisted && pathname.replace(/\/+$/u, '') === '/app/account/appearance';
}

export function resolveAnonymousThemePreference(
	context: AnonymousAppearanceContext,
	form?: FormData,
): ThemePreference {
	return normalizeThemePreference({
		scheme: form?.get('colorScheme')
			?? context.url.searchParams.get('colorScheme')
			?? context.cookies.get(COLOR_SCHEME_COOKIE)?.value,
		mode: form?.get('themeMode')
			?? context.url.searchParams.get('themeMode')
			?? context.cookies.get(THEME_MODE_COOKIE)?.value,
	});
}

export function anonymousThemeCookieOptions(context: Pick<AnonymousAppearanceContext, 'url'>) {
	return {
		path: '/',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365,
		secure: context.url.protocol === 'https:',
	};
}

export function setAnonymousThemeCookies(
	context: AnonymousAppearanceContext,
	preference: ThemePreference,
) {
	const options = anonymousThemeCookieOptions(context);
	context.cookies.set(COLOR_SCHEME_COOKIE, preference.scheme, options);
	context.cookies.set(THEME_MODE_COOKIE, preference.mode, options);
}

function appearanceFromPrincipal(context: Pick<AppearanceContext, 'locals'>): AppearancePreference | null {
	const principal = context.locals.auth?.principal;
	const appearance = principal?.metadata?.appearance;
	if (!appearance || typeof appearance !== 'object') return null;
	return normalizeAppearancePreference(appearance);
}

export function themePreferenceFromPrincipal(principal: { metadata?: Record<string, unknown> | null } | null | undefined): AppearancePreference | null {
	const appearance = principal?.metadata?.appearance;
	if (!appearance || typeof appearance !== 'object') return null;
	return normalizeAppearancePreference(appearance);
}

export function setPrincipalThemeCookies(
	context: AnonymousAppearanceContext,
	principal: { metadata?: Record<string, unknown> | null } | null | undefined,
): ThemePreference | null {
	const preference = themePreferenceFromPrincipal(principal);
	if (!preference) return null;
	setAnonymousThemeCookies(context, preference);
	return preference;
}

export async function resolveAuthenticatedThemePreference(context: AppearanceContext): Promise<AppearancePreference> {
	return appearanceFromPrincipal(context) ?? normalizeAppearancePreference(resolveAnonymousThemePreference(context));
}

export async function resolveUserThemePreference(
	context: AppearanceContext,
	userId: string,
): Promise<AppearancePreference> {
	const principal = context.locals.auth?.principal;
	if (principal?.id === userId) {
		return appearanceFromPrincipal(context) ?? normalizeAppearancePreference(resolveAnonymousThemePreference(context));
	}
	return normalizeAppearancePreference(resolveAnonymousThemePreference(context));
}

export async function setUserThemeCookies(
	context: AppearanceContext,
	userId: string,
): Promise<ThemePreference> {
	const preference = await resolveUserThemePreference(context, userId);
	setAnonymousThemeCookies(context, preference);
	return preference;
}

import type { APIContext } from 'astro';
import { NOTIFICATION_CONTENT_CAPABILITIES, normalizeNotificationPreferences, type PersonalThemeDraft } from '@treeseed/sdk/account-contracts';
import { validateGuidedThemePalette } from '@treeseed/ui/theme';
import { ensureCsrfToken, requireCsrf } from '../lib/auth/csrf';
import { clearApiAccessTokenCookie, createApiFacade } from '../lib/market/api-client';
import { loadAppContext } from './app-access';

export const ACCOUNT_SECTIONS = [
	{ id: 'identity', label: 'Identity', href: '/app/account' },
	{ id: 'sessions', label: 'Sessions', href: '/app/account/sessions' },
	{ id: 'notifications', label: 'Notifications', href: '/app/account/notifications' },
	{ id: 'appearance', label: 'Appearance', href: '/app/account/appearance' },
	{ id: 'delete', label: 'Delete', href: '/app/account/delete' },
] as const;

function redirectStatus(context: APIContext, route: string, status: string, error = false) {
	const target = new URL(route, context.url.origin);
	target.searchParams.set(error ? 'error' : 'status', status);
	return context.redirect(`${target.pathname}${target.search}`, 303);
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'The account operation failed.';
}

export async function loadAccountFrame(context: APIContext, section: typeof ACCOUNT_SECTIONS[number]['id']) {
	const app = await loadAppContext(context);
	return {
		app,
		api: createApiFacade(context),
		csrfToken: ensureCsrfToken(context),
		sections: ACCOUNT_SECTIONS.map((entry) => ({ ...entry, current: entry.id === section })),
		status: context.url.searchParams.get('status'),
		error: context.url.searchParams.get('error'),
	};
}

export async function handleIdentityRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	requireCsrf(context, form.get('csrfToken'));
	const intent = String(form.get('intent') ?? '');
	try {
		if (intent === 'profile') await api.updateAccountProfile({ firstName: String(form.get('firstName') ?? ''), lastName: String(form.get('lastName') ?? ''), image: String(form.get('image') ?? '') || null });
		else if (intent === 'add-email') await api.addAccountEmail(String(form.get('email') ?? ''));
		else if (intent === 'resend-email') await api.resendAccountEmail(String(form.get('emailId') ?? ''));
		else if (intent === 'primary-email') await api.setPrimaryAccountEmail(String(form.get('emailId') ?? ''));
		else if (intent === 'delete-email') await api.deleteAccountEmail(String(form.get('emailId') ?? ''));
		else if (intent === 'password') await api.updateAccountPassword({ currentPassword: String(form.get('currentPassword') ?? ''), password: String(form.get('password') ?? ''), reauthenticationGrantId: String(form.get('reauthenticationGrantId') ?? '') || undefined });
		else if (intent === 'unlink-provider') await api.unlinkAccountProvider(String(form.get('identityId') ?? ''));
		else throw new Error('Unknown account action.');
		return redirectStatus(context, '/app/account', intent === 'profile' ? 'Identity saved.' : intent === 'password' ? 'Password updated.' : 'Account updated.');
	} catch (error) {
		return redirectStatus(context, '/app/account', errorMessage(error), true);
	}
}

export async function handleSessionRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	requireCsrf(context, form.get('csrfToken'));
	try {
		await api.revokeAccountSession(String(form.get('sessionId') ?? ''));
		return redirectStatus(context, '/app/account/sessions', 'Session revoked.');
	} catch (error) { return redirectStatus(context, '/app/account/sessions', errorMessage(error), true); }
}

export async function handleNotificationRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	requireCsrf(context, form.get('csrfToken'));
	const overrideProjects = form.getAll('overrideProjects').map(String);
	const preferences = normalizeNotificationPreferences({
		emailCadence: String(form.get('emailCadence') ?? 'daily') as any,
		timeZone: String(form.get('timeZone') ?? 'UTC'),
		globalContentTypes: form.getAll('globalContentTypes').map(String),
		projectOverrides: overrideProjects.map((projectId) => ({ projectId, contentTypes: form.getAll(`projectTypes:${projectId}`).map(String) })),
	});
	try {
		await api.updateNotificationPreferences(preferences);
		return redirectStatus(context, '/app/account/notifications', 'Notification preferences saved.');
	} catch (error) { return redirectStatus(context, '/app/account/notifications', errorMessage(error), true); }
}

function themeDraft(form: FormData): PersonalThemeDraft {
	const palette = {
		light: { canvas: String(form.get('light.canvas') ?? ''), surface: String(form.get('light.surface') ?? ''), text: String(form.get('light.text') ?? ''), accent: String(form.get('light.accent') ?? '') },
		dark: { canvas: String(form.get('dark.canvas') ?? ''), surface: String(form.get('dark.surface') ?? ''), text: String(form.get('dark.text') ?? ''), accent: String(form.get('dark.accent') ?? '') },
	};
	const validation = validateGuidedThemePalette(palette);
	if (!validation.ok) throw new Error(validation.errors.join(' '));
	return { name: String(form.get('name') ?? '').trim(), baseScheme: String(form.get('baseScheme') ?? 'fern'), palette };
}

export async function handleAppearanceRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	requireCsrf(context, form.get('csrfToken'));
	const intent = String(form.get('intent') ?? '');
	try {
		if (intent === 'create-theme') await api.createPersonalTheme(themeDraft(form));
		else if (intent === 'update-theme') await api.updatePersonalTheme(String(form.get('themeId') ?? ''), themeDraft(form));
		else if (intent === 'delete-theme') await api.deletePersonalTheme(String(form.get('themeId') ?? ''));
		else throw new Error('Unknown appearance action.');
		return redirectStatus(context, '/app/account/appearance', intent === 'delete-theme' ? 'Theme deleted.' : 'Theme saved.');
	} catch (error) { return redirectStatus(context, '/app/account/appearance', errorMessage(error), true); }
}

export async function handleDeletionRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	requireCsrf(context, form.get('csrfToken'));
	try {
		await api.deleteCurrentAccount({ confirmation: String(form.get('confirmation') ?? ''), currentPassword: String(form.get('currentPassword') ?? ''), reauthenticationGrantId: String(form.get('reauthenticationGrantId') ?? '') || undefined });
		clearApiAccessTokenCookie(context);
		return context.redirect('/auth/sign-in?deleted=1', 303);
	} catch (error) { return redirectStatus(context, '/app/account/delete', errorMessage(error), true); }
}

export { NOTIFICATION_CONTENT_CAPABILITIES };

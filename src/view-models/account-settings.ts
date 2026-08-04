import type { APIContext } from 'astro';
import { NOTIFICATION_CONTENT_CAPABILITIES, normalizeNotificationPreferences, type PersonalThemeDraft } from '@treeseed/sdk/account-contracts';
import { validateGuidedThemePalette } from '@treeseed/ui/theme';
import { formSubmissionResponse, type FormSubmissionResponse } from '@treeseed/ui/forms';
import { isValidTimeZone } from '@treeseed/ui/timestamps';
import { passwordMeetsPolicy, passwordPolicyMessage } from '../lib/auth/accounts/password-policy';
import { ensureCsrfToken, requireCsrf } from '../lib/auth/support/csrf';
import { ACCOUNT_SECTIONS } from '../lib/accounts/navigation';
import { clearApiAccessTokenCookie, createApiFacade } from '../lib/market/api-client';
import { loadAppContext } from './app-access';

export { ACCOUNT_SECTIONS } from '../lib/accounts/navigation';

function respond(context: APIContext, route: string, result: FormSubmissionResponse) {
	return formSubmissionResponse(context.request, result, { fallbackRedirect: route });
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'The account operation failed.';
}

function failure(error: unknown, fieldErrors?: Record<string, string>): FormSubmissionResponse {
	return { ok: false, code: 'account_operation_failed', message: errorMessage(error), fieldErrors };
}

export async function loadAccountFrame(context: APIContext, section: typeof ACCOUNT_SECTIONS[number]['id']) {
	const app = await loadAppContext(context);
	const api = createApiFacade(context);
	return {
		app,
		api,
		preferences: await api.accountPreferences().catch(() => ({ timeZone: 'UTC', realTimeUpdates: true, realTimePollingIntervalSeconds: 5 as const })),
		csrfToken: ensureCsrfToken(context),
		sections: ACCOUNT_SECTIONS.map((entry) => ({ ...entry, current: entry.id === section })),
	};
}

export async function handleIdentityRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	const intent = String(form.get('intent') ?? '');
	try {
		requireCsrf(context, form.get('csrfToken'));
		if (intent === 'profile') await api.updateAccountProfile({
			firstName: String(form.get('firstName') ?? ''),
			lastName: String(form.get('lastName') ?? ''),
			image: String(form.get('image') ?? '') || null,
			headline: String(form.get('headline') ?? '') || null,
			profileSummary: String(form.get('profileSummary') ?? '') || null,
			location: String(form.get('location') ?? '') || null,
			website: String(form.get('website') ?? '') || null,
			expertise: String(form.get('expertise') ?? '').split(',').map((entry) => entry.trim()).filter(Boolean),
		});
		else if (intent === 'time-zone') {
			const timeZone = String(form.get('timeZone') ?? '');
			if (!isValidTimeZone(timeZone)) throw new Error('Select a valid time zone.');
			await api.updateAccountPreferences({ timeZone });
		}
		else if (intent === 'add-email') await api.addAccountEmail(String(form.get('email') ?? ''));
		else if (intent === 'resend-email') await api.resendAccountEmail(String(form.get('emailId') ?? ''));
		else if (intent === 'primary-email') await api.setPrimaryAccountEmail(String(form.get('emailId') ?? ''));
		else if (intent === 'delete-email') await api.deleteAccountEmail(String(form.get('emailId') ?? ''));
		else if (intent === 'password') {
			const password = String(form.get('password') ?? '');
			const confirmPassword = String(form.get('confirmPassword') ?? '');
			if (password !== confirmPassword) throw new Error('Passwords do not match.');
			if (!passwordMeetsPolicy(password)) throw new Error(passwordPolicyMessage());
			await api.updateAccountPassword({ currentPassword: String(form.get('currentPassword') ?? ''), password, reauthenticationGrantId: String(form.get('reauthenticationGrantId') ?? '') || undefined });
		}
		else if (intent === 'unlink-provider') await api.unlinkAccountProvider(String(form.get('identityId') ?? ''));
		else throw new Error('Unknown account action.');
		return respond(context, '/app/account', {
			ok: true,
			code: intent === 'password' ? 'password_updated' : 'account_updated',
			message: intent === 'profile'
				? 'Identity saved.'
				: intent === 'time-zone'
					? 'Time zone saved.'
					: intent === 'password'
						? 'Password updated.'
						: intent === 'add-email' || intent === 'resend-email'
							? 'Verification email sent.'
							: 'Account updated.',
		});
	} catch (error) {
		const message = errorMessage(error);
		const fieldErrors: Record<string, string> | undefined = intent === 'password'
			? message === 'Passwords do not match.'
				? { confirmPassword: message }
				: /current password|reauthentication/iu.test(message)
					? { currentPassword: message }
					: { password: message }
			: intent === 'add-email'
				? { email: message }
				: intent === 'time-zone'
					? { timeZone: message }
				: undefined;
		return respond(context, '/app/account', failure(error, fieldErrors));
	}
}

export async function handleSessionRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	try {
		requireCsrf(context, form.get('csrfToken'));
		await api.revokeAccountSession(String(form.get('sessionId') ?? ''));
		return respond(context, '/app/account/sessions', { ok: true, code: 'session_revoked', message: 'Session revoked.' });
	} catch (error) { return respond(context, '/app/account/sessions', failure(error)); }
}

export async function handleNotificationRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	const overrideProjects = form.getAll('overrideProjects').map(String);
	const preferences = normalizeNotificationPreferences({
		emailCadence: String(form.get('emailCadence') ?? 'daily') as any,
		globalContentTypes: form.getAll('globalContentTypes').map(String),
		projectOverrides: overrideProjects.map((projectId) => ({ projectId, contentTypes: form.getAll(`projectTypes:${projectId}`).map(String) })),
	});
	try {
		requireCsrf(context, form.get('csrfToken'));
		await api.updateNotificationPreferences(preferences);
		return respond(context, '/app/account/notifications', { ok: true, code: 'notification_preferences_saved', message: 'Notification preferences saved.' });
	} catch (error) { return respond(context, '/app/account/notifications', failure(error)); }
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
	const intent = String(form.get('intent') ?? '');
	try {
		requireCsrf(context, form.get('csrfToken'));
		if (intent === 'create-theme') await api.createPersonalTheme(themeDraft(form));
		else if (intent === 'update-theme') await api.updatePersonalTheme(String(form.get('themeId') ?? ''), themeDraft(form));
		else if (intent === 'delete-theme') await api.deletePersonalTheme(String(form.get('themeId') ?? ''));
		else if (intent === 'realtime') await api.updateAccountPreferences({
			realTimeUpdates: String(form.get('realTimeUpdates') ?? 'true') === 'true',
			realTimePollingIntervalSeconds: Number(form.get('realTimePollingIntervalSeconds') ?? 5) as 2 | 5 | 15 | 30,
		});
		else throw new Error('Unknown appearance action.');
		return respond(context, '/app/account/appearance', { ok: true, code: intent === 'delete-theme' ? 'theme_deleted' : intent === 'realtime' ? 'realtime_saved' : 'theme_saved', message: intent === 'delete-theme' ? 'Theme deleted.' : intent === 'realtime' ? 'Real-time experience saved.' : 'Theme saved.' });
	} catch (error) { return respond(context, '/app/account/appearance', failure(error)); }
}

export async function handleDeletionRequest(context: APIContext, api: ReturnType<typeof createApiFacade>) {
	if (context.request.method !== 'POST') return null;
	const form = await context.request.formData();
	try {
		requireCsrf(context, form.get('csrfToken'));
		await api.deleteCurrentAccount({ confirmation: String(form.get('confirmation') ?? ''), currentPassword: String(form.get('currentPassword') ?? ''), reauthenticationGrantId: String(form.get('reauthenticationGrantId') ?? '') || undefined });
		clearApiAccessTokenCookie(context);
		return respond(context, '/app/account/delete', { ok: true, code: 'account_deleted', message: 'Account deleted.', redirect: '/auth/sign-in?deleted=1' });
	} catch (error) { return respond(context, '/app/account/delete', failure(error)); }
}

export { NOTIFICATION_CONTENT_CAPABILITIES };

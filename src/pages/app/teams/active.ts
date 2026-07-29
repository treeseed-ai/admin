import type { APIRoute } from 'astro';
import { formSubmissionResponse } from '@treeseed/ui/forms';
import { requireCsrf } from '../../../lib/auth/support/csrf';
import { loadAppContext } from '../../../view-models/app-access';

async function bodyFor(request: Request) {
	if (request.headers.get('content-type')?.includes('application/json')) {
		return await request.json().catch(() => ({})) as Record<string, unknown>;
	}
	const form = await request.formData();
	return Object.fromEntries(form.entries());
}

export const POST: APIRoute = async (context) => {
	if (!context.locals.auth?.principal) return new Response(null, { status: 401 });
	const body = await bodyFor(context.request);
	try {
		requireCsrf(context, body.csrfToken);
	} catch {
		return formSubmissionResponse(context.request, {
			ok: false,
			code: 'csrf_invalid',
			message: 'Your form session expired. Refresh the page and try again.',
		}, { fallbackRedirect: '/app/teams' });
	}
	const app = await loadAppContext(context);
	if (app.teamsStatus === 'unavailable') {
		return formSubmissionResponse(context.request, {
			ok: false,
			code: 'teams_unavailable',
			message: 'Teams are temporarily unavailable. Try again.',
		}, { fallbackRedirect: '/app/teams' });
	}
	const team = app.teams.find((entry: any) => entry.id === body.teamId && (entry.status ?? 'active') === 'active');
	if (!team) {
		return formSubmissionResponse(context.request, {
			ok: false,
			code: 'team_forbidden',
			message: 'That team is not available for active selection.',
			fieldErrors: { teamId: 'Choose an active team you can access.' },
		}, { fallbackRedirect: '/app/teams' });
	}
	context.cookies.set('treeseed_active_team', team.id, {
		path: '/app',
		httpOnly: false,
		sameSite: 'lax',
		secure: context.url.protocol === 'https:',
		maxAge: 31_536_000,
	});
	return formSubmissionResponse(context.request, {
		ok: true,
		code: 'active_team_updated',
		message: 'Active team updated.',
		payload: { teamId: team.id },
	}, { fallbackRedirect: '/app/teams' });
};

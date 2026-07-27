import type { APIContext } from 'astro';
import { formSubmissionResponse, type FormSubmissionResponse } from '@treeseed/ui/forms';

export function pageFormResponse(
	context: APIContext,
	result: FormSubmissionResponse,
	fallbackRedirect: string,
) {
	const response = formSubmissionResponse(context.request, result, { fallbackRedirect });
	for (const cookie of context.cookies.headers()) response.headers.append('set-cookie', cookie);
	return response;
}

export function pageFormFailure(
	context: APIContext,
	message: string,
	fallbackRedirect: string,
	fieldErrors?: Record<string, string>,
	code = 'form_submission_failed',
) {
	return pageFormResponse(context, { ok: false, code, message, fieldErrors }, fallbackRedirect);
}

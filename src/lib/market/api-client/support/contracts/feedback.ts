import type { FeedbackCollection, FeedbackCollectionFilters, FeedbackDetail, FeedbackExportRecord, FeedbackStatus } from '@treeseed/sdk/feedback';
import type { ApiClientFacade } from '../../../api-client.ts';

export function listFeedbackMethod(this: ApiClientFacade, filters: FeedbackCollectionFilters = {}) {
	const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)]));
	return this.request<FeedbackCollection>('GET', `/v1/admin/feedback${query.size ? `?${query}` : ''}`);
}

export function getFeedbackMethod(this: ApiClientFacade, feedbackId: string) {
	return this.request<FeedbackDetail>('GET', `/v1/admin/feedback/${encodeURIComponent(feedbackId)}`);
}

export function updateFeedbackStatusMethod(this: ApiClientFacade, feedbackId: string, input: { status: FeedbackStatus; note?: string; version: number }) {
	return this.request<{ status: FeedbackStatus; version: number }>('PATCH', `/v1/admin/feedback/${encodeURIComponent(feedbackId)}/status`, { body: input });
}

export function createFeedbackExportMethod(this: ApiClientFacade, input: FeedbackCollectionFilters & { includeScreenshots?: boolean; feedbackIds?: string[] }) {
	return this.request<FeedbackExportRecord & { operationId: string }>('POST', '/v1/admin/feedback/exports', { body: input });
}

export function getFeedbackExportMethod(this: ApiClientFacade, exportId: string) {
	return this.request<FeedbackExportRecord>('GET', `/v1/admin/feedback/exports/${encodeURIComponent(exportId)}`);
}

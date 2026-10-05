import type { ApiClientFacade } from '../../lib/market/api-client.ts';
import { items, record, type JsonRecord } from '../../lib/operations/records.ts';

export interface FocusSnapshot {
	summary: JsonRecord;
	questions: JsonRecord[];
	proposals: JsonRecord[];
	decisions: JsonRecord[];
	events: JsonRecord[];
	unavailable: string[];
}

async function capture<T>(label: string, operation: Promise<T>, unavailable: string[]): Promise<T | null> {
	try { return await operation; }
	catch { unavailable.push(label); return null; }
}

export async function loadFocusSnapshot(api: ApiClientFacade, teamId: string): Promise<FocusSnapshot> {
	const unavailable: string[] = [];
	const [summary, questions, proposals, decisions, events] = await Promise.all([
		capture('summary', api.getCommonsSummary(), unavailable),
		capture('questions', api.listCommonsQuestions({ teamId, limit: 100 }), unavailable),
		capture('proposals', api.listCommonsProposals({ teamId, limit: 100 }), unavailable),
		capture('decisions', api.listCommonsDecisions({ teamId, limit: 100 }), unavailable),
		capture('events', api.listCommonsEvents({ teamId, limit: 100 }), unavailable),
	]);
	return {
		summary: record(summary), questions: items(questions), proposals: items(proposals),
		decisions: items(decisions), events: items(events), unavailable,
	};
}

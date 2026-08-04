import type { ApiClientFacade } from '../../lib/market/api-client.ts';
import { items, record, type JsonRecord } from '../../lib/operations/records.ts';

export interface CommandSnapshot {
	workdays: JsonRecord[];
	assignments: JsonRecord[];
	executions: JsonRecord[];
	providers: JsonRecord[];
	approvals: JsonRecord[];
	projects: JsonRecord[];
	inbox: JsonRecord[];
	reservations: JsonRecord[];
	ledger: JsonRecord[];
	decisions: JsonRecord[];
	unavailable: string[];
}

async function capture<T>(label: string, operation: Promise<T>, unavailable: string[]): Promise<T | null> {
	try { return await operation; }
	catch { unavailable.push(label); return null; }
}

export async function loadCommandSnapshot(api: ApiClientFacade, teamId: string): Promise<CommandSnapshot> {
	const unavailable: string[] = [];
	const base = `/v1/teams/${encodeURIComponent(teamId)}`;
	const [workdays, assignments, executions, providers, approvals, projects, inbox, decisions] = await Promise.all([
		capture('workdays', api.request('GET', `${base}/workday-runs?limit=100`), unavailable),
		capture('assignments', api.request('GET', `${base}/capacity/assignments?limit=200`), unavailable),
		capture('executions', api.request('GET', `${base}/capacity/execution-runs?projection=activity&limit=200`), unavailable),
		capture('providers', api.request('GET', `${base}/capacity/availability-sessions?limit=100`), unavailable),
		capture('approvals', api.listApprovalRequestsForTeam(teamId, { limit: 100 }), unavailable),
		capture('projects', api.listTeamProjects(teamId), unavailable),
		capture('inbox', api.listPersistedTeamInboxItems(teamId), unavailable),
		capture('decisions', api.listCommonsDecisions({ teamId, limit: 100 }), unavailable),
	]);
	const projectItems = items(projects);
	const evidence = await Promise.all(projectItems.map(async (project) => {
		const projectId = encodeURIComponent(String(project.id));
		const [reservations, ledger] = await Promise.all([
			capture(`reservations:${project.id}`, api.request('GET', `${base}/capacity/reservations?projectId=${projectId}&limit=100`), unavailable),
			capture(`ledger:${project.id}`, api.request('GET', `${base}/capacity/ledger?projectId=${projectId}&limit=100`), unavailable),
		]);
		return { reservations: items(reservations), ledger: items(ledger) };
	}));
	return {
		workdays: items(workdays), assignments: items(assignments), executions: items(executions),
		providers: items(providers), approvals: items(approvals), projects: projectItems,
		inbox: items(inbox), unavailable,
		reservations: evidence.flatMap((entry) => entry.reservations), ledger: evidence.flatMap((entry) => entry.ledger), decisions: items(decisions),
	};
}

export function activeWorkday(snapshot: CommandSnapshot): JsonRecord | null {
	return snapshot.workdays.find((run) => String(run.status) === 'running') ?? null;
}

export function projectMap(snapshot: CommandSnapshot) {
	return new Map(snapshot.projects.map((project) => [String(project.id), record(project)]));
}

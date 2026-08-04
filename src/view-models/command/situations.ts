import { dateValue, record, statusTone, text, type JsonRecord } from '../../lib/operations/records.ts';
import type { CommandSnapshot } from './command-state.ts';

export interface CommandSituation {
	id: string;
	title: string;
	description: string;
	status: string;
	tone: ReturnType<typeof statusTone>;
	timestamp: string | null;
	href: string;
	actionLabel: string;
	evidence: string;
	inferred: boolean;
	priority: number;
}

function situation(input: CommandSituation) { return input; }

export function deriveCommandSituations(snapshot: CommandSnapshot, now = Date.now()): CommandSituation[] {
	const values: CommandSituation[] = [];
	for (const run of snapshot.workdays) {
		const status = String(run.status ?? '');
		if (!['failed', 'degraded'].includes(status)) continue;
		values.push(situation({ id: `workday:${run.id}`, title: `Workday ${status}`,
			description: text(record(run.error).message, record(run.summary).message, 'The workday ended without a clean completion and needs review.'),
			status, tone: statusTone(status), timestamp: dateValue(run.completedAt, run.updatedAt), href: `/app/work/${encodeURIComponent(String(run.id))}`,
			actionLabel: 'Inspect workday', evidence: 'Durable workday status', inferred: false, priority: 100 }));
	}
	for (const execution of snapshot.executions) {
		if (String(execution.status) !== 'failed') continue;
		const agent = record(execution.agent); const assignment = record(execution.assignment);
		values.push(situation({ id: `execution:${execution.id}`, title: `${text(agent.className, agent.agentId, 'Agent')} execution failed`,
			description: text(assignment.lifecycleReason, 'A failed execution has trace evidence available for recovery planning.'),
			status: 'failed', tone: 'danger', timestamp: dateValue(record(execution.timing).failedAt, record(execution.timing).finishedAt),
			href: `/app/command/assignments/${encodeURIComponent(String(assignment.id ?? ''))}`, actionLabel: 'Inspect evidence',
			evidence: 'Execution-run activity projection', inferred: false, priority: 95 }));
	}
	for (const assignment of snapshot.assignments) {
		const lease = dateValue(assignment.leaseExpiresAt, assignment.lease_expires_at);
		const leaseState = String(assignment.leaseState ?? assignment.lease_state ?? '');
		if (!lease || !['leased', 'active'].includes(leaseState)) continue;
		const remaining = Date.parse(lease) - now;
		if (remaining > 5 * 60_000) continue;
		values.push(situation({ id: `lease:${assignment.id}`, title: remaining <= 0 ? 'Assignment lease expired' : 'Assignment lease nearing expiry',
			description: `${text(assignment.agentId, assignment.agent_id, 'An agent')} may require recovery if the provider does not renew its lease.`,
			status: remaining <= 0 ? 'expired' : 'urgent', tone: remaining <= 0 ? 'danger' : 'warning', timestamp: lease,
			href: `/app/command/assignments/${encodeURIComponent(String(assignment.id))}`, actionLabel: 'Inspect assignment',
			evidence: 'Lease expiration', inferred: true, priority: remaining <= 0 ? 92 : 82 }));
	}
	for (const approval of snapshot.approvals) {
		const status = String(approval.status ?? approval.state ?? 'pending');
		if (!['pending', 'waiting_for_approval', 'under_review', 'approval_required'].includes(status)) continue;
		const projectId = text(approval.projectId, approval.project_id);
		values.push(situation({ id: `approval:${approval.id}`, title: text(approval.title, 'Decision awaiting review'),
			description: text(approval.description, approval.summary, 'Work is waiting for an authorized judgment.'), status, tone: 'warning',
			timestamp: dateValue(approval.createdAt, approval.updatedAt), href: projectId ? `/app/projects/${encodeURIComponent(projectId)}` : '/app/focus/proposals',
			actionLabel: 'Enter focused review', evidence: 'Approval request', inferred: false, priority: 85 }));
	}
	const liveProviders = snapshot.providers.filter((provider) => ['active', 'open', 'ready'].includes(String(provider.status ?? '')));
	if (snapshot.providers.length > 0 && liveProviders.length === 0) values.push(situation({ id: 'providers:none', title: 'No provider capacity is available',
		description: 'Configured provider sessions are present, but none currently report an available state.', status: 'blocked', tone: 'danger',
		timestamp: snapshot.providers.map((provider) => dateValue(provider.updatedAt, provider.lastCheckInAt)).filter(Boolean).sort().at(-1) ?? null,
		href: '/app/capacity', actionLabel: 'Inspect capacity', evidence: 'Provider availability sessions', inferred: true, priority: 90 }));
	for (const reservation of snapshot.reservations) {
		const overrun = String(reservation.overrunStatus ?? reservation.overrun_status ?? '');
		const pressure = Number(reservation.utilization ?? reservation.utilizationPercent ?? 0);
		if (!['requested', 'pending'].includes(overrun) && pressure < 90) continue;
		values.push(situation({ id: `budget:${reservation.id}`, title: overrun ? 'Capacity overrun awaiting review' : 'Capacity budget under pressure',
			description: text(reservation.reason, 'Committed usage is approaching or exceeds the authorized reservation.'), status: overrun || 'warning', tone: 'warning',
			timestamp: dateValue(reservation.updatedAt, reservation.createdAt), href: '/app/capacity', actionLabel: 'Review capacity',
			evidence: 'Capacity reservation and usage projection', inferred: !overrun, priority: overrun ? 88 : 72 }));
	}
	for (const item of snapshot.inbox) {
		const kind = `${item.type ?? ''} ${item.category ?? ''} ${item.title ?? ''}`.toLowerCase();
		const status = String(item.status ?? item.severity ?? '');
		if (!kind.includes('guarantee') && !kind.includes('verification')) continue;
		if (!['failed', 'error', 'degraded', 'blocking'].some((value) => status.includes(value) || kind.includes(value))) continue;
		values.push(situation({ id: `guarantee:${item.id}`, title: text(item.title, 'Verification evidence requires attention'),
			description: text(item.summary, item.description, 'A product promise has failing evidence.'), status: status || 'failed', tone: 'danger',
			timestamp: dateValue(item.updatedAt, item.createdAt), href: text(item.href, '/app/projects'), actionLabel: 'Inspect evidence',
			evidence: 'Persisted operational inbox evidence', inferred: false, priority: 94 }));
	}
	for (const decision of snapshot.decisions) {
		const accepted = ['accepted', 'approved', 'decided'].includes(String(decision.status ?? decision.outcome ?? ''));
		if (!accepted || decision.capacityPlanId || decision.capacity_plan_id) continue;
		values.push(situation({ id: `decision:${decision.id}`, title: 'Decision ready but not capacity-planned',
			description: text(decision.title, decision.summary, 'An authorized decision has no linked capacity plan.'), status: 'planning required', tone: 'warning',
			timestamp: dateValue(decision.decidedAt, decision.updatedAt, decision.createdAt), href: '/app/focus/decisions', actionLabel: 'Enter focused review',
			evidence: 'Decision planning provenance', inferred: true, priority: 80 }));
	}
	for (const project of snapshot.projects) {
		const state = `${project.status ?? ''} ${project.releaseStatus ?? ''} ${project.forecastStatus ?? ''}`.toLowerCase();
		if (!['at_risk', 'blocked', 'delayed', 'failed'].some((value) => state.includes(value))) continue;
		values.push(situation({ id: `project:${project.id}`, title: `${text(project.displayName, project.name, 'Project')} requires attention`,
			description: text(project.forecastSummary, project.releaseSummary, project.description, 'Project forecast or release evidence indicates risk.'), status: state || 'at risk', tone: state.includes('failed') ? 'danger' : 'warning',
			timestamp: dateValue(project.updatedAt, project.forecastUpdatedAt), href: `/app/projects/${encodeURIComponent(String(project.id))}`, actionLabel: 'Open project',
			evidence: 'Project forecast or release projection', inferred: true, priority: 78 }));
	}
	return [...new Map(values.map((entry) => [entry.id, entry])).values()]
		.sort((left, right) => right.priority - left.priority || String(right.timestamp).localeCompare(String(left.timestamp)))
		.slice(0, 15);
}

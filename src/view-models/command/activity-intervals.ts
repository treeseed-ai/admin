import { dateValue, record, text, type JsonRecord } from '../../lib/operations/records.ts';

export type ActivityKind = 'acting' | 'reviewing' | 'estimating' | 'planning' | 'reporting';

export interface ActivityInterval {
	id: string;
	assignmentId: string;
	agentId: string;
	agentLabel: string;
	projectId: string;
	activity: ActivityKind;
	status: string;
	start: number;
	end: number;
	ongoing: boolean;
	lane: number;
}

const activityPriority: Record<ActivityKind, number> = {
	acting: 5, reviewing: 4, estimating: 3, planning: 2, reporting: 1,
};

export function activityKind(run: JsonRecord): ActivityKind {
	const value = `${run.mode ?? ''} ${run.handler ?? ''} ${record(run.agent).mode ?? ''}`.toLowerCase();
	if (value.includes('review')) return 'reviewing';
	if (value.includes('estimat')) return 'estimating';
	if (value.includes('report') || value.includes('summar')) return 'reporting';
	if (value.includes('act') || value.includes('execut')) return 'acting';
	return 'planning';
}

export function projectActivityIntervals(runs: JsonRecord[], now = Date.now()): ActivityInterval[] {
	const projected = runs.flatMap((run): ActivityInterval[] => {
		const timing = record(run.timing);
		const assignment = record(run.assignment);
		const agent = record(run.agent);
		const startedAt = dateValue(timing.startedAt, run.startedAt, timing.createdAt, run.createdAt);
		if (!startedAt) return [];
		const finishedAt = dateValue(timing.finishedAt, timing.completedAt, timing.failedAt, run.finishedAt);
		const start = Date.parse(startedAt);
		const ongoing = !finishedAt && ['running', 'active', 'leased', 'queued'].includes(String(run.status ?? ''));
		const end = finishedAt ? Date.parse(finishedAt) : now;
		if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
		return [{
			id: String(run.id ?? `${assignment.id}:${start}`),
			assignmentId: text(assignment.id, run.assignmentId),
			agentId: text(agent.agentId, agent.id, run.agentId, 'unknown-agent'),
			agentLabel: text(agent.displayName, agent.className, agent.agentId, run.agentId, 'Unknown agent'),
			projectId: text(assignment.projectId, run.projectId),
			activity: activityKind(run), status: String(run.status ?? 'unknown'), start, end, ongoing, lane: 0,
		}];
	});
	const byAgent = new Map<string, ActivityInterval[]>();
	for (const interval of projected) byAgent.set(interval.agentId, [...(byAgent.get(interval.agentId) ?? []), interval]);
	for (const intervals of byAgent.values()) {
		const laneEnds: number[] = [];
		for (const interval of intervals.sort((left, right) => left.start - right.start || left.id.localeCompare(right.id))) {
			let lane = laneEnds.findIndex((end) => end <= interval.start);
			if (lane < 0) lane = laneEnds.length;
			interval.lane = lane;
			laneEnds[lane] = interval.end;
		}
	}
	return projected;
}

export function visibleActivity(intervals: ActivityInterval[], rangeStart: number, rangeEnd: number) {
	const visible = intervals.filter((entry) => entry.start < rangeEnd && entry.end > rangeStart);
	const agents = [...new Set(visible.map((entry) => entry.agentId))];
	agents.sort((left, right) => {
		const leftRuns = visible.filter((entry) => entry.agentId === left);
		const rightRuns = visible.filter((entry) => entry.agentId === right);
		const leftActive = Math.max(0, ...leftRuns.filter((entry) => entry.ongoing).map((entry) => activityPriority[entry.activity]));
		const rightActive = Math.max(0, ...rightRuns.filter((entry) => entry.ongoing).map((entry) => activityPriority[entry.activity]));
		const leftRecent = Math.max(...leftRuns.map((entry) => entry.end));
		const rightRecent = Math.max(...rightRuns.map((entry) => entry.end));
		return rightActive - leftActive || rightRecent - leftRecent || left.localeCompare(right);
	});
	return { intervals: visible, agents };
}

export function mergeActivityRuns(previous: JsonRecord[], incoming: JsonRecord[]) {
	return [...new Map([...previous, ...incoming].map((run) => [String(run.id), run])).values()];
}

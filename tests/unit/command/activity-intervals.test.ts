import { describe, expect, it } from 'vitest';
import { activityKind, mergeActivityRuns, projectActivityIntervals, visibleActivity } from '../../../src/view-models/command/activity-intervals.ts';

const now = Date.parse('2026-08-03T16:00:00.000Z');

function run(id: string, agentId: string, start: string, end?: string, extra: Record<string, unknown> = {}) {
	return { id, status: end ? 'succeeded' : 'running', agent: { agentId, displayName: agentId }, assignment: { id: `assignment-${id}` }, timing: { startedAt: start, finishedAt: end }, ...extra };
}

describe('command activity intervals', () => {
	it('classifies configured activity without trusting display labels', () => {
		expect(activityKind({ mode: 'acting' })).toBe('acting');
		expect(activityKind({ handler: 'proposal-review' })).toBe('reviewing');
		expect(activityKind({ handler: 'capacity-estimate' })).toBe('estimating');
		expect(activityKind({ handler: 'workday-report' })).toBe('reporting');
		expect(activityKind({ mode: 'unknown' })).toBe('planning');
	});

	it('extends active runs to now and places overlap in deterministic sub-lanes', () => {
		const intervals = projectActivityIntervals([
			run('one', 'architect', '2026-08-03T15:50:00.000Z'),
			run('two', 'architect', '2026-08-03T15:55:00.000Z', '2026-08-03T15:58:00.000Z'),
		], now);
		expect(intervals.find((entry) => entry.id === 'one')).toMatchObject({ end: now, ongoing: true, lane: 0 });
		expect(intervals.find((entry) => entry.id === 'two')?.lane).toBe(1);
	});

	it('filters by intersection and sorts active agents by activity priority', () => {
		const intervals = projectActivityIntervals([
			run('plan', 'planner', '2026-08-03T15:55:00.000Z', undefined, { mode: 'planning' }),
			run('act', 'executor', '2026-08-03T15:56:00.000Z', undefined, { mode: 'acting' }),
			run('old', 'historian', '2026-08-03T14:00:00.000Z', '2026-08-03T14:05:00.000Z'),
		], now);
		const visible = visibleActivity(intervals, now - 15 * 60_000, now);
		expect(visible.agents).toEqual(['executor', 'planner']);
		expect(visible.intervals.map((entry) => entry.id)).not.toContain('old');
	});

	it('deduplicates durable IDs while retaining refreshed state', () => {
		expect(mergeActivityRuns([{ id: 'one', status: 'running' }], [{ id: 'one', status: 'succeeded' }, { id: 'two' }])).toEqual([{ id: 'one', status: 'succeeded' }, { id: 'two' }]);
	});
});

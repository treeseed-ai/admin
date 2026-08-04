import { describe, expect, it } from 'vitest';
import type { CommandSnapshot } from '../../../src/view-models/command/command-state.ts';
import { deriveCommandSituations } from '../../../src/view-models/command/situations.ts';

const empty = (): CommandSnapshot => ({ workdays: [], assignments: [], executions: [], providers: [], approvals: [], projects: [], inbox: [], reservations: [], ledger: [], decisions: [], unavailable: [] });

describe('command situations', () => {
	it('derives supported conditions from attributable records', () => {
		const snapshot = empty();
		snapshot.workdays = [{ id: 'w', status: 'degraded' }];
		snapshot.executions = [{ id: 'e', status: 'failed', agent: { agentId: 'a' }, assignment: { id: 'x' }, timing: {} }];
		snapshot.assignments = [{ id: 'x', agentId: 'a', leaseState: 'leased', leaseExpiresAt: '2026-08-03T16:02:00.000Z' }];
		snapshot.providers = [{ id: 'p', status: 'closed' }];
		snapshot.approvals = [{ id: 'a', status: 'pending', title: 'Approve release' }];
		snapshot.reservations = [{ id: 'r', overrunStatus: 'requested' }];
		snapshot.inbox = [{ id: 'g', type: 'guarantee', status: 'failed', title: 'Guarantee failed' }];
		snapshot.decisions = [{ id: 'd', status: 'accepted', title: 'Ship it' }];
		snapshot.projects = [{ id: 'p1', name: 'Market', forecastStatus: 'at_risk' }];
		const derived = deriveCommandSituations(snapshot, Date.parse('2026-08-03T16:00:00.000Z'));
		for (const id of ['workday:w', 'execution:e', 'lease:x', 'providers:none', 'approval:a', 'budget:r', 'guarantee:g', 'decision:d', 'project:p1']) expect(derived.map((item) => item.id), id).toContain(id);
		expect(derived[0].priority).toBeGreaterThanOrEqual(derived.at(-1)!.priority);
		expect(derived.find((item) => item.id === 'lease:x')?.inferred).toBe(true);
	});

	it('resolves unsupported conditions and caps the deck at fifteen', () => {
		const snapshot = empty();
		snapshot.workdays = Array.from({ length: 20 }, (_, index) => ({ id: String(index), status: 'failed' }));
		expect(deriveCommandSituations(snapshot)).toHaveLength(15);
		expect(deriveCommandSituations(empty())).toEqual([]);
	});
});

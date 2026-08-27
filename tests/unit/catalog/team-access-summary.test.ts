import { describe, expect, it, vi } from 'vitest';
import { getTeamAccessSummaryMethod } from '../../../src/lib/market/api-client/teams/queries/get-team-access-summary.ts';

describe('team access catalog adapter', () => {
	it('normalizes nested access while preserving the catalog response', async () => {
		const invoke = vi.fn().mockResolvedValue({
			team: { id: 'team-1' },
			access: { roles: ['team_owner'], permissions: ['teams:manage'] },
		});

		const result = await getTeamAccessSummaryMethod.call({ invoke } as any, 'team-1');

		expect(result.roles).toEqual(['team_owner']);
		expect(result.permissions).toEqual(['teams:manage']);
		expect(result.access?.roles).toEqual(['team_owner']);
		expect(result.team).toEqual({ id: 'team-1' });
	});
});

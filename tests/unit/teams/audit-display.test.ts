import { describe, expect, it } from 'vitest';
import { teamAuditDisplay } from '../../../src/lib/teams/audit-display';

describe('team audit display', () => {
	it('presents a profile update with a resolved actor and human change labels', () => {
		const display = teamAuditDisplay({
			id: 'audit-machine-id',
			actorType: 'user',
			actor: { type: 'user', displayName: 'Ada Owner', email: 'ada@example.com' },
			eventType: 'team.updated',
			createdAt: '2026-07-28T12:00:00.000Z',
			data: {
				changes: [
					{ field: 'displayName', label: 'Display name', before: 'Old name', after: 'New name' },
					{ field: 'visibility', label: 'Visibility', before: 'private', after: 'public' },
				],
			},
		});

		expect(display).toMatchObject({
			title: 'Team profile updated',
			actorLabel: 'Ada Owner',
			actorKind: 'Team member',
			details: ['Display name changed', 'Visibility changed'],
		});
		expect(display.description).toBe('Updated display name and visibility.');
		expect(JSON.stringify(display)).not.toContain('team.updated');
		expect(JSON.stringify(display)).not.toContain('audit-machine-id');
	});

	it('explains membership changes without exposing membership identifiers', () => {
		const display = teamAuditDisplay({
			actorType: 'user',
			actor: { type: 'user', displayName: 'Ada Owner' },
			eventType: 'team.member.role_changed',
			data: {
				membershipId: 'membership-machine-id',
				subjectDisplayName: 'Grace Member',
				previousRoleKey: 'viewer',
				roleKey: 'contributor',
			},
		});

		expect(display.description).toBe('Changed Grace Member from Viewer to Contributor.');
		expect(JSON.stringify(display)).not.toContain('membership-machine-id');
	});

	it('uses clear fallbacks for historical records without actor projections', () => {
		const display = teamAuditDisplay({
			actorType: 'user',
			eventType: 'team.created',
			data: { name: 'example-team' },
		});

		expect(display.actorLabel).toBe('Former team member');
		expect(display.description).toBe('Created the @example-team team.');
	});
});

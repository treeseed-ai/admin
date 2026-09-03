import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
	return readFileSync(path, 'utf8');
}

describe('public knowledge profile composition', () => {
	it('composes both principals from the canonical UI profile system', () => {
		const user = source('src/pages/u/[username].astro');
		for (const component of ['KnowledgeProfileLayout', 'KnowledgeProfileIdentity', 'KnowledgeProfileStats', 'KnowledgeProfileCollection', 'KnowledgeActivityTrail']) {
			expect(user, `user profile should use ${component}`).toContain(component);
		}
		expect(user).toContain('accountPreferences()');
		expect(user).toContain('timeZone={timeZone}');

		const team = source('src/pages/t/[name].astro');
		expect(team).toContain("TeamViewer from '@treeseed/ui/components/astro/team/TeamViewer.astro'");
		expect(team).toContain('<TreeseedPublicLayout');
		expect(team).toContain('<TeamViewer');
		expect(team).toContain('publicView');
		for (const page of [user, team]) {
			expect(page).not.toContain('ProfileTemplate');
			expect(page).not.toContain('formatTimestamp');
		}
	});

	it('keeps attribution explicit and private administration absent', () => {
		const user = source('src/pages/u/[username].astro');
		const team = source('src/pages/t/[name].astro');
		expect(user).toContain('Team membership stays private');
		expect(team).toContain('Published team resource');
		expect(team).toContain('Public projects');
		for (const promotionalFallback of [
			'Growing reusable knowledge in public',
			'Learning, building, and sharing in public',
			'Ready to reuse',
			'Where knowledge grows',
			'Follow the public knowledge trail',
		]) {
			expect(user, promotionalFallback).not.toContain(promotionalFallback);
			expect(team, promotionalFallback).not.toContain(promotionalFallback);
		}
		for (const page of [user, team]) {
			expect(page).not.toContain('memberCount');
			expect(page).not.toContain('effectiveCapabilities');
			expect(page).not.toContain('auditEvents');
		}
	});

	it('loads the shared visual system and persisted timezone through the public shell', () => {
		const layout = source('src/layouts/PublicLayout.astro');
		expect(layout).toContain("@treeseed/ui/styles/knowledge-profile.css");
		expect(layout).toContain('accountPreferences()');
		expect(layout).toContain('timeZone={timeZone}');
		expect(layout).toContain('showFooter={!profilePage}');
	});

	it('keeps anonymous public responses eligible for shared edge caching', () => {
		const middleware = source('src/middleware.ts');
		const userProfile = source('src/lib/market/api-client/accounts/queries/load-user-profile-by-username.ts');
		expect(middleware).not.toContain("import { ensureCsrfToken }");
		expect(middleware).not.toContain('ensureCsrfToken(context)');
		expect(source('src/layouts/AppLayout.astro')).toContain('ensureCsrfToken(Astro)');
		expect(userProfile).toContain('CONTROL_PLANE_OPERATIONS.accounts.publicProfile');
		expect(userProfile).not.toContain('/v1/users/by-username/');
	});

	it('shows canonical management tabs only for the owning account or a team member', () => {
		const user = source('src/pages/u/[username].astro');
		const team = source('src/pages/t/[name].astro');
		const accountNavigation = source('src/components/account/AccountNavigation.astro');
		const teamNavigation = source('src/components/team/TeamNavigation.astro');
		expect(user).toContain('isOwnProfile');
		expect(user).toContain('<AccountNavigation');
		expect(user).toContain('slot="navigation"');
		expect(accountNavigation).toContain('ACCOUNT_SECTIONS');
		expect(accountNavigation).toContain('current="public-profile"');
		expect(team).toContain('api.listTeamsForPrincipal()');
		expect(team).toContain('memberTeam ?');
		expect(team).toContain('<TeamNavigation');
		expect(team).toContain('memberTeam?.allowedActions?.edit');
		expect(teamNavigation).toContain("visible: canManage");
		expect(teamNavigation).toContain("visible: isOwner");
	});
});

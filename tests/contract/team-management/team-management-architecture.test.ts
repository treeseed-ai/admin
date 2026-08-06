import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string) {
	return readFileSync(path, 'utf8');
}

describe('team management architecture audit', () => {
	it('owns one canonical route for each team administration responsibility', () => {
		const routes = source('src/routes.ts');
		for (const route of [
			'/app/teams',
			'/app/teams/active',
			'/app/teams/new',
			'/app/teams/[teamId]',
			'/app/teams/[teamId]/edit',
			'/app/teams/[teamId]/members',
			'/app/teams/[teamId]/delete',
			'/app/projects',
			'/app/command',
			'/app/focus',
			'/app/work',
			'/app/services',
			'/app/capacity',
			'/app/knowledge',
			'/app/market',
			'/team-invites/[token]/accept',
			'/t/[name]',
		]) expect(routes, route).toContain(`adminRoute('${route}'`);
	});

	it('keeps active-team selection explicit and exposes collection failure states', () => {
		const collection = source('src/pages/app/teams/index.astro');
		const active = source('src/pages/app/teams/active.ts');
		const creation = source('src/pages/app/teams/new.astro');
		const access = source('src/view-models/app-access.ts');
		expect(collection).toContain('Active teams');
		expect(collection).toContain('Archived teams');
		expect(collection).toContain('Teams are temporarily unavailable');
		expect(collection).toContain('Set active');
		expect(collection).toContain('data-team-name');
		expect(collection).toContain('emphasis="strong"');
		expect(collection.match(/class="ts-resource-grid" data-spacing="roomy"/gu)).toHaveLength(2);
		expect(collection).toContain("{ key: 'Projects', value: team.counts?.projects ?? 0 }");
		expect(collection).toContain("{ key: 'Capacity providers', value: team.counts?.capacityProviders ?? 0 }");
		expect(collection).not.toContain("{ key: 'Capabilities'");
		expect(collection).not.toContain("{ label: 'Leave'");
		const activeCards = collection.slice(collection.indexOf('{activeTeams.map'), collection.indexOf('{archivedTeams.length'));
		expect(activeCards).not.toContain('>Archive</Button>');
		expect(collection).not.toContain("cookies.set('treeseed_active_team'");
		expect(creation).not.toContain("cookies.set('treeseed_active_team'");
		expect(access).not.toContain('selectableTeams[0]');
		expect(active).toContain("entry.status ?? 'active'");
		expect(active).toContain('team_forbidden');
		expect(active).toContain("cookies.set('treeseed_active_team'");
		const layout = source('src/layouts/AppLayout.astro');
		expect(layout).toContain("label: 'Team overview'");
		expect(layout).toContain("href: `/app/teams/${encodeURIComponent(activeTeam.id)}`");
		expect(layout).toContain("label: 'Manage teams', href: '/app/teams'");
		expect(layout).not.toContain("label: 'Create team', href: '/app/teams/new'");
	});

	it('keeps overview, settings, membership, consent, and lifecycle responsibilities complete', () => {
		const overview = source('src/pages/app/teams/[teamId]/index.astro');
		for (const label of ['Members', 'Pending invitations', 'Projects', 'Services', 'Capacity and allocation', 'Knowledge', 'Catalog and billing', 'Project content activity', 'Recent team audit activity', 'Agent Lab']) {
			expect(overview, label).toContain(label);
		}
		expect(overview).toContain("import ProjectActivityChart from '@treeseed/ui/components/react/ProjectActivityChart'");
		expect(overview).toContain('data-scene="team.overview.content-activity"');
		expect(overview).toContain('initialBucketSizeMs={604_800_000}');
		expect(overview).toContain('pollIntervalMs={null}');
		expect(overview).toContain("new Set(['team_owner', 'project_lead'])");
		expect(overview).not.toContain('team.overview.management-actions');
		const overviewHeader = overview.slice(overview.indexOf('<PageHeader'), overview.indexOf('<TeamNavigation'));
		expect(overviewHeader).not.toContain('slot="actions"');
		expect(overviewHeader).not.toMatch(/>(?:Settings|Members)</u);
		const marketPage = source('src/pages/app/market/index.astro');
		expect(marketPage).toContain('currentPath="/app/market"');
		expect(marketPage).toContain('This bounded landing page preserves domain ownership.');

		const settings = source('src/pages/app/teams/[teamId]/edit.astro');
		for (const field of ['name="name"', 'name="displayName"', 'name="logoUrl"', 'name="profileSummary"', 'name="visibility"', 'name="expectedUpdatedAt"']) {
			expect(settings, field).toContain(field);
		}
		expect(settings).toContain('data-team-profile-preview');

		const members = source('src/pages/app/teams/[teamId]/members.astro');
		for (const action of [
			'team.invitation.create',
			'team.invitation.resend',
			'team.invitation.revoke',
			'team.member.role',
			'team.ownership.transfer',
			'team.member.remove',
			'team.member.leave',
		]) expect(members, action).toContain(`data-scene="${action}"`);
		expect(members).toContain('Every recipient must explicitly accept');
		expect(members).toContain("redirect: '/app/teams'");
		expect(members).toContain('/removal-blockers');
		expect(members).toContain('Removal checks are unavailable.');
		expect(members).toContain('soleCurrentOwner');
		expect(members).toContain('Add or transfer ownership before changing your owner role.');
		expect(members).toContain('Roles and responsibilities');
		expect(members).toContain("import InlineSearch from '@treeseed/ui/components/astro/forms/search/InlineSearch.astro'");
		expect(members).toContain("import AccessibleDialog from '@treeseed/ui/components/astro/overlays/AccessibleDialog.astro'");
		expect(members).toContain("import IdentitySummary from '@treeseed/ui/components/astro/patterns/IdentitySummary.astro'");
		expect(members).toContain('data-dialog-open="team-role-reference"');
		expect(members).toContain('timeZone={preferences.timeZone}');
		expect(members).toContain('density="comfortable"');
		expect(members).toContain('class="ts-table-actions__primary"');
		expect(members).not.toContain('<Panel eyebrow="Reference"');
		expect(members).toContain("description=\"Search everyone on the team and inspect their role and responsibilities.\"");
		expect(members).toContain('<th hidden={!canManage}>Actions</th>');
		expect(members).toContain('<td data-label="Actions" data-layout="stack" hidden={!canManage}>');
		expect(members).toMatch(/\{canManage \? \(\s*<Panel eyebrow="Consent"/u);
		expect(members).not.toContain('Team membership controls unavailable');
		expect(members).not.toContain('can list or manage other members');

		const consent = source('src/pages/team-invites/[token]/accept.astro');
		expect(consent).toContain("api.request<any>('GET'");
		expect(consent).toContain("api.request<any>('POST'");
		expect(consent).toContain('team.invitation.switch-account');
		expect(consent).toContain('name="inviteToken"');
		expect(consent).toContain('name="inviteEmail"');
		expect(consent).not.toMatch(/method=["']get["'][^>]*accept/iu);
		const logout = source('src/pages/auth/logout.ts');
		expect(logout).toContain('requestedReturnTo');
		expect(logout).toContain("signInParams.set('inviteToken'");
		expect(source('src/pages/auth/sign-in.astro')).toContain("registrationParams.set('inviteToken'");

		const lifecycle = source('src/pages/app/teams/[teamId]/delete.astro');
		for (const action of ['team.archive', 'team.restore', 'team.delete']) {
			expect(lifecycle, action).toContain(`data-scene="${action}"`);
		}
		expect(lifecycle).toContain('Lifecycle checks are unavailable');
		expect(lifecycle).toContain('Delete team permanently');
		expect(lifecycle).toContain('<Countdown');
		expect(lifecycle).toContain('timeZone={preferences.timeZone}');
		expect(lifecycle).not.toContain('Advance acceptance clock');
	});

	it('uses UI-owned navigation, displays, responsive behavior, and timezone-aware timestamps', () => {
		const teamPages = [
			'src/pages/app/teams/[teamId]/index.astro',
			'src/pages/app/teams/[teamId]/edit.astro',
			'src/pages/app/teams/[teamId]/members.astro',
			'src/pages/app/teams/[teamId]/delete.astro',
		];
		for (const path of teamPages) {
			const page = source(path);
			expect(page, path).toContain('TeamNavigation');
			expect(page, path).toContain('contentOwnsPageHeader');
		}
		for (const path of ['src/pages/app/teams/index.astro', ...teamPages]) {
			expect(source(path), path).not.toContain('data-ts-time');
		}
		const access = source('src/lib/teams/access-display.ts');
		expect(access).toContain('Manage projects');
		expect(access).toContain('Manage workstreams');
		const navigation = source('src/components/team/TeamNavigation.astro');
		expect(navigation).toContain("import SurfaceTabs from '@treeseed/ui/components/astro/shell/navigation/SurfaceTabs.astro'");
		expect(navigation).toContain('<SurfaceTabs');
		expect(navigation).toContain('wrap');
		expect(navigation).not.toContain('ts-team-tabs');
		for (const path of teamPages) {
			const page = source(path);
			expect(page.match(/<TeamNavigation\b/gu), path).toHaveLength(1);
			expect(page, path).not.toContain('team.overview.management-actions');
		}
		const accessDetails = source('src/components/team/TeamAccessDetails.astro');
		expect(accessDetails).toContain("import DisclosureList from '@treeseed/ui/components/astro/data/DisclosureList.astro'");
		const overview = source('src/pages/app/teams/[teamId]/index.astro');
		for (const component of ['ActivityFeed', 'KeyValueList', 'MetricCard', 'MetricGrid', 'Stack']) {
			expect(overview, component).toContain(`@treeseed/ui/components/astro/`);
		}
		expect(overview).not.toMatch(/<TeamAccessDetails[\s\S]*?\sopen(?:\s|\/|>)/u);
		expect(overview).not.toContain('event.actorId');
		expect(overview).not.toContain('eventType}</');
		const auditDisplay = source('src/lib/teams/audit-display.ts');
		expect(auditDisplay).toContain('Team profile updated');
		expect(auditDisplay).toContain('subjectDisplayName');
		expect(auditDisplay).toContain('Former team member');
		expect(auditDisplay).toContain('/u/${encodeURIComponent(actorUsername)}');
		expect(auditDisplay).toContain('actorImageSrc');
		const members = source('src/pages/app/teams/[teamId]/members.astro');
		for (const component of ['ActionList', 'Badge', 'ResponsiveTable', 'InlineConfirmation', 'Pagination']) {
			expect(members, component).toContain(`@treeseed/ui/components/astro/`);
		}
		const layout = source('src/layouts/AppLayout.astro');
		expect(layout).not.toContain("styles/team-management.css");
		expect(layout).not.toContain("styles/team-access.css");
		expect(existsSync('src/styles/team-management.css')).toBe(false);
		expect(existsSync('src/styles/team-access.css')).toBe(false);
		const forbiddenLocalVisuals = /ts-(?:team-tabs|access-disclosure|responsive-table|status-badge|detail-list|audit-card|team-summary-link|team-card__metrics)/u;
		for (const path of ['src/pages/app/teams/index.astro', ...teamPages, 'src/pages/team-invites/[token]/accept.astro']) {
			expect(source(path), path).not.toMatch(forbiddenLocalVisuals);
		}
	});

	it('requires every production team UI guarantee and the fail-closed aggregate to be active together', () => {
		const manifests = [
			'guarantees/team/team/create-team.guarantee.yaml',
			'guarantees/team/team/switch-active-team.guarantee.yaml',
			'guarantees/team/team/edit-team-settings.guarantee.yaml',
			'guarantees/team/team/view-team-overview.guarantee.yaml',
			'guarantees/team/team/delete-team.guarantee.yaml',
			'guarantees/team/membership/invite-team-members.guarantee.yaml',
			'guarantees/team/membership/accept-team-invitation.guarantee.yaml',
			'guarantees/team/membership/change-member-role.guarantee.yaml',
			'guarantees/team/membership/remove-team-member.guarantee.yaml',
			'guarantees/team/team/view-public-team-profile.guarantee.yaml',
		];
		for (const path of manifests) {
			const manifest = source(path);
			expect(manifest, path).toContain('status: active');
			expect(manifest, path).toContain('uiFeature:');
			expect(manifest, path).toContain('manifest:');
		}
		const aggregate = source('guarantees/team/team/team-management-production-readiness.guarantee.yaml');
		expect(aggregate).toContain('status: active');
		expect(aggregate).toContain('requiredForRelease: true');
	});

	it('hands the primary authenticated session to every owner journey that consumes run-created team state', () => {
		for (const path of [
			'guarantees/team/scenes/create-team.scene.yaml',
			'guarantees/team/scenes/switch-active-team.scene.yaml',
			'guarantees/team/scenes/edit-team-settings.scene.yaml',
			'guarantees/team/scenes/view-team-overview.scene.yaml',
			'guarantees/team/scenes/delete-team.scene.yaml',
			'guarantees/team/membership/scenes/invite-team-members.scene.yaml',
			'guarantees/team/membership/scenes/change-member-role.scene.yaml',
			'guarantees/team/membership/scenes/remove-team-member.scene.yaml',
		]) {
			const scene = source(path);
			expect(scene, path).toContain('key: auth.primary-session');
			expect(scene, path).toContain('kind: browser-storage');
		}
	});

	it('proves ownership transfer, restoration, self-leave, lost access, and last-owner rejection through rendered controls', () => {
		const roleScene = source('guarantees/team/membership/scenes/change-member-role.scene.yaml');
		expect(roleScene).toContain('team.ownership');
		expect(roleScene).toContain('transfer-ownership-to-invited-member');
		expect(roleScene).toContain('restore-primary-ownership');
		expect(roleScene).toContain('form[data-scene="team.ownership.transfer"]');
		expect(roleScene).toContain('Ownership transferred.');

		const removalScene = source('guarantees/team/membership/scenes/remove-team-member.scene.yaml');
		expect(removalScene).toContain('leave-as-existing-member');
		expect(removalScene).toContain('prove-self-leave-lost-access');
		expect(removalScene).toContain('reject-last-owner-leave');
		expect(removalScene).toContain('A team must keep at least one owner.');

		const roleGuarantee = source('guarantees/team/membership/change-member-role.guarantee.yaml');
		const removalGuarantee = source('guarantees/team/membership/remove-team-member.guarantee.yaml');
		expect(roleGuarantee).toContain('audit:\n  required: true\n  verifierRefs: [api.team.role.correlated]');
		expect(removalGuarantee).toContain('audit:\n  required: true\n  verifierRefs: [api.team.remove.correlated]');

		const verifierRegistry = source('guarantees/verifiers/ui.verifiers.yaml');
		for (const [ref, phase] of [
			['api.team.role.correlated', 'role'],
			['api.team.remove.correlated', 'remove'],
		] as const) {
			const block = verifierRegistry.split(`  ${ref}:`)[1]?.split(/\n  [a-z]/u)[0] ?? '';
			expect(block, ref).toContain('ownerPackage: "@treeseed/api"');
			expect(block, ref).toContain('cwd: packages/api');
			expect(block, ref).toContain('command: scripts/guarantees/verify-team-run-state.ts');
			expect(block, ref).toContain(`args: [${phase}]`);
		}
	});
});

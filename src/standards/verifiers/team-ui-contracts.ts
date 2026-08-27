#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function source(path: string) {
	const target = resolve(packageRoot, path);
	if (!existsSync(target)) throw new Error(`Packed Admin route is missing: ${path}`);
	return readFileSync(target, 'utf8');
}

function verifyRequirements(requirements: Array<[string, string[]]>) {
	const diagnostics: Array<{ severity: 'error'; code: string; message: string }> = [];
	const requireText = (path: string, values: string[]) => {
		let content = '';
		try { content = source(path); }
		catch (error) { diagnostics.push({ severity: 'error', code: 'admin.route_missing', message: error instanceof Error ? error.message : String(error) }); return; }
		for (const value of values) if (!content.includes(value)) diagnostics.push({
			severity: 'error', code: 'admin.catalog_binding_missing', message: `${path} is missing ${value}.`,
		});
	};
	for (const [path, values] of requirements) requireText(path, values);
	return diagnostics;
}

export function runTeamUiContractsVerifier() {
	const startedAt = new Date().toISOString();
	const teamDiagnostics = verifyRequirements([
		['dist/pages/app/teams/index.astro', ['Team', 'data-scene']],
		['dist/pages/app/teams/new.astro', ['CONTROL_PLANE_OPERATIONS.teams.create', 'data-ts-submit="enhanced"']],
		['dist/pages/app/teams/[teamId]/edit.astro', ['CONTROL_PLANE_OPERATIONS.teams.update']],
		['dist/pages/app/teams/[teamId]/delete.astro', ['deletionReadiness']],
		['dist/pages/app/teams/[teamId]/members.astro', ['CONTROL_PLANE_OPERATIONS.teams.invite', 'CONTROL_PLANE_OPERATIONS.teams.updateMember',
			'CONTROL_PLANE_OPERATIONS.teams.memberRemovalBlockers', 'CONTROL_PLANE_OPERATIONS.teams.transferOwnership']],
	]);
	const identityDiagnostics = verifyRequirements([
		['dist/pages/auth/authorize.astro', ['oauthProtocolRequest', 'value="approve"', 'value="deny"', 'requireCsrf']],
		['dist/pages/auth/device/approve.astro', ['api.approveDevice', 'requireCsrf', 'Approve login']],
		['dist/pages/auth/confirm-email.astro', ['api.confirmEmail', 'requireCsrf', 'Sign in']],
		['dist/pages/auth/register.astro', ['submitMarketEmailAuthFlow', 'confirmationRequired', 'RegistrationForm']],
		['dist/pages/auth/forgot-password.astro', ['api.requestPasswordReset', 'data-ts-submit="enhanced"']],
		['dist/pages/auth/logout.js', ['/oauth/revoke', 'clearApiAccessTokenCookie', 'clearApiRefreshTokenCookie']],
		['dist/pages/app/account/index.astro', ['loadAccountFrame', 'AccountIdentitySettings']],
		['dist/pages/app/account/appearance.astro', ['handleAppearanceRequest', 'loadAccountFrame']],
		['dist/pages/app/account/notifications.astro', ['handleNotificationRequest', 'loadAccountFrame']],
		['dist/pages/app/account/sessions.astro', ['handleSessionRequest', 'accountSessions']],
		['dist/pages/app/account/delete.astro', ['handleDeletionRequest', 'loadAccountFrame']],
	]);
	const checks = [
		{ id: 'admin.team.ui-contracts', diagnostics: teamDiagnostics },
		{ id: 'admin.identity-account.ui-contracts', diagnostics: identityDiagnostics },
	].map((entry) => ({ ...entry, status: entry.diagnostics.length ? 'failed' : 'passed', durationMs: 0 }));
	const ok = checks.every((entry) => entry.status === 'passed');
	return { schemaVersion: 'treeseed.guarantee-verifier-result/v1' as const, verifierId: '@treeseed/admin/team-ui-contracts',
		startedAt, completedAt: new Date().toISOString(), ok, checks };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const report = runTeamUiContractsVerifier();
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
	if (!report.ok) process.exitCode = 1;
}

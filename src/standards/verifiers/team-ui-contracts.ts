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

export function runTeamUiContractsVerifier() {
	const startedAt = new Date().toISOString();
	const diagnostics: Array<{ severity: 'error'; code: string; message: string }> = [];
	const requireText = (path: string, values: string[]) => {
		let content = '';
		try { content = source(path); }
		catch (error) { diagnostics.push({ severity: 'error', code: 'admin.route_missing', message: error instanceof Error ? error.message : String(error) }); return; }
		for (const value of values) if (!content.includes(value)) diagnostics.push({
			severity: 'error', code: 'admin.catalog_binding_missing', message: `${path} is missing ${value}.`,
		});
	};
	requireText('dist/pages/app/teams/index.astro', ['Team', 'data-scene']);
	requireText('dist/pages/app/teams/new.astro', ['CONTROL_PLANE_OPERATIONS.teams.create', 'data-ts-submit="enhanced"']);
	requireText('dist/pages/app/teams/[teamId]/edit.astro', ['CONTROL_PLANE_OPERATIONS.teams.update']);
	requireText('dist/pages/app/teams/[teamId]/delete.astro', ['deletionReadiness']);
	requireText('dist/pages/app/teams/[teamId]/members.astro', [
		'CONTROL_PLANE_OPERATIONS.teams.invite', 'CONTROL_PLANE_OPERATIONS.teams.updateMember',
		'CONTROL_PLANE_OPERATIONS.teams.memberRemovalBlockers', 'CONTROL_PLANE_OPERATIONS.teams.transferOwnership',
	]);
	const ok = diagnostics.length === 0;
	return { schemaVersion: 'treeseed.guarantee-verifier-result/v1' as const, verifierId: '@treeseed/admin/team-ui-contracts',
		startedAt, completedAt: new Date().toISOString(), ok, checks: [{ id: 'admin.team.ui-contracts', status: ok ? 'passed' : 'failed', durationMs: 0, diagnostics }] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const report = runTeamUiContractsVerifier();
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
	if (!report.ok) process.exitCode = 1;
}

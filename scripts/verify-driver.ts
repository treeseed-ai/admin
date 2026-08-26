#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

if (process.env.TREESEED_VERIFY_ENTRYPOINT_CHECK === 'true') {
	process.exit(0);
}

const driver = process.env.TREESEED_VERIFY_DRIVER ?? 'direct';
const command = driver === 'act'
	? { executable: 'npx', arguments: ['act', '--job', 'verify'] }
	: { executable: 'npm', arguments: ['run', 'verify:direct'] };

const result = spawnSync(command.executable, command.arguments, {
	cwd: process.cwd(),
	stdio: 'inherit',
	env: process.env,
});

process.exit(result.status ?? 1);

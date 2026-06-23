#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('src')) {
  process.exit(0);
}

if (process.env.TREESEED_SKIP_PACKAGE_PREPARE === '1') {
  process.exit(0);
}

const result = spawnSync('npm', ['run', 'build:dist'], { stdio: 'inherit' });
process.exit(result.status ?? 1);

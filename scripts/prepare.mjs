#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('src')) {
  process.exit(0);
}

const result = spawnSync('npm', ['run', 'build:dist'], { stdio: 'inherit' });
process.exit(result.status ?? 1);

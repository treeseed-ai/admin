#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const packageName = '@treeseed/admin';
const extraArgs = process.argv.slice(2);
const tagName = process.env.GITHUB_REF_NAME;

if (tagName && !/^\d+\.\d+\.\d+$/.test(tagName)) {
  console.error(`Refusing to publish ${packageName} from non-stable tag "${tagName}".`);
  process.exit(1);
}

const npmArgs = ['publish', '.', '--access', 'public'];

if (process.env.GITHUB_ACTIONS === 'true') {
  npmArgs.push('--provenance');
}

npmArgs.push(...extraArgs);

const result = spawnSync('npm', npmArgs, {
  cwd: process.cwd(),
  encoding: 'utf8',
  env: process.env,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

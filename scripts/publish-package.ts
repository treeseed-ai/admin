#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const packageName = '@treeseed/admin';
const extraArgs = process.argv.slice(2);
const tagName = process.env.GITHUB_REF_NAME;
const semverTagPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (tagName && !semverTagPattern.test(tagName)) {
  console.error(`Refusing to publish ${packageName} from invalid semantic version tag "${tagName}".`);
  process.exit(1);
}

if (extraArgs.some((argument) => argument === '--tag' || argument.startsWith('--tag='))) {
  console.error('release:publish owns npm dist-tag selection; a caller cannot override --tag.');
  process.exit(1);
}

const npmDistTag = tagName?.includes('-') ? 'next' : 'latest';
const npmArgs = ['publish', '.', '--access', 'public', '--tag', npmDistTag];

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

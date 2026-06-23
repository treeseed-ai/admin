#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const semverTagPattern = /^\d+\.\d+\.\d+$/;
const tagName = process.argv[2] || process.env.GITHUB_REF_NAME;

if (!tagName) {
  console.error('Release tag validation requires a tag name argument or GITHUB_REF_NAME.');
  process.exit(1);
}

if (!semverTagPattern.test(tagName)) {
  console.error(`Release tag "${tagName}" must use "{MAJOR}.{MINOR}.{PATCH}", for example "${packageJson.version}".`);
  process.exit(1);
}

if (tagName !== packageJson.version) {
  console.error(`Release tag version "${tagName}" does not match @treeseed/admin version "${packageJson.version}".`);
  process.exit(1);
}

console.log(`Release tag "${tagName}" matches @treeseed/admin version "${packageJson.version}".`);

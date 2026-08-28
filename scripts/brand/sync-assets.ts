#!/usr/bin/env node

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const canonicalLogo = fileURLToPath(import.meta.resolve('@treeseed/ui/assets/treeseed-logo.svg'));
const publicLogo = resolve('public/logo.svg');

mkdirSync(dirname(publicLogo), { recursive: true });
copyFileSync(canonicalLogo, publicLogo);

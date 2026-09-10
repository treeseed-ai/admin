import { it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

it('materializes the canonical TreeSeed logo at both advertised public asset URLs', () => {
  const root = mkdtempSync(join(tmpdir(), 'treeseed-brand-'));
  try {
    execFileSync(process.execPath, ['--experimental-strip-types', resolve('scripts/brand/sync-assets.ts')], { cwd: root });
    const canonical = readFileSync(new URL(import.meta.resolve('@treeseed/ui/assets/treeseed-logo.svg')));
    expect(readFileSync(join(root, 'public/logo.svg'))).toEqual(canonical);
    expect(readFileSync(join(root, 'public/favicon.svg'))).toEqual(canonical);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

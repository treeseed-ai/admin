import { test, expect } from 'bun:test';
import { spawnSync } from 'node:child_process';
class AdoptionTests {
  program(): void {
    const result = spawnSync('node', ['dist/tests/support/capacity-contract-program.js'], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('owner-adoption-ok\n');
  }
}
const adoption = new AdoptionTests();
test('regression: installed native owner identities match exact peer selections and vendored archive pins', adoption.program.bind(adoption));

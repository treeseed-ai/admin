import { test, expect } from 'bun:test';
import { spawnSync } from 'node:child_process';

class OwnerCompatibilityAcceptance {
  run(): void {
    const result = spawnSync('node', ['dist/tests/support/capacity-contract-program.js'], {
      encoding: 'utf8', timeout: 5000,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe('admin-capacity-contracts-ok\n');
  }
}
const suite = new OwnerCompatibilityAcceptance();
test('acceptance: built Admin consumes exact capacity-compatible owner contracts', suite.run.bind(suite));

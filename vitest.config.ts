import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@treeseed/sdk/platform/plugin': resolve(__dirname, 'tests/support/shims/sdk-platform-plugin.ts'),
    },
  },
  test: {
    include: ['tests/{unit,integration,contract}/**/*.test.ts'],
    testTimeout: 30000,
  },
});

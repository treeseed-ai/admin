import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@treeseed/sdk/platform/plugin': resolve(__dirname, 'test/shims/sdk-platform-plugin.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    environment: 'node',
    exclude: ['**/node_modules/**', '**/tests/*.spec.ts'],
    include: ['**/tests/*.test.ts', '**/tests/*.test.tsx'],
  },
});

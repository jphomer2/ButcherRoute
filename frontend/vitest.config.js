import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include:  ['server/lib/**', 'server/routes/**'],
      exclude:  ['server/routes/parse.js'], // requires DB — covered by integration tests
    },
  },
});

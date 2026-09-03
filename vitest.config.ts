import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use Node environment (no DOM needed for API integration tests)
    environment: 'node',
    // Load .env.local before any test module
    setupFiles: ['./vitest.setup.ts'],
    // Increase timeout for real network calls against Supabase
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Globals (describe, it, expect, etc.) injected without imports
    globals: true,
    // Run test files serially so seed -> delete -> verify stays in order
    // (Vitest 4: fileParallelism replaces the removed poolOptions / singleThread)
    fileParallelism: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/app/api/**/*.ts', 'src/lib/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      // Mirror the "@/*" path alias from tsconfig.json
      '@': path.resolve(__dirname, './src'),
    },
  },
});

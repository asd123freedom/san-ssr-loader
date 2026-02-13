import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['test/**/*.test.ts'],
    exclude: ['test/coverage/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'test/coverage',
      include: ['src/**/*'] // 保持原样，src 下没有 .san 文件
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    }
  },
  resolve: {
    extensions: ['.js', '.ts', '.san', '.json'],
    alias: {
      'san$': require.resolve('san')
    }
  }
});

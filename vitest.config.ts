import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        testTimeout: 10000,
        include: ['__tests__/**/*.test.ts', '__tests__/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            lines: 80,
            functions: 80,
            branches: 75,
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});

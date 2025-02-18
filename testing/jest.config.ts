import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/testing/**/*.test.ts'],
  setupFilesAfterEnv: ['./setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'es2018',
        sourceMap: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chrome-launcher)/)',
  ],
  testTimeout: 180000, // Increased to 3 minutes
  verbose: true,
  detectOpenHandles: true,
};

export default config; 
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },
  verbose: true,
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^(\\.\\.?\\/.+)\\.js$': '$1'
  }
};

export default config;

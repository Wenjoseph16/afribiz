import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup-framework.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss)$': 'identity-obj-proxy',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/hooks/**/*.{ts,tsx}',
    'src/components/ui/**/*.{ts,tsx}',
    'src/stores/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/app/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 25,
      lines: 30,
      statements: 25,
    },
    'src/hooks/**/*.{ts,tsx}': {
      branches: 30,
      functions: 35,
      lines: 40,
      statements: 35,
    },
    'src/components/ui/**/*.{ts,tsx}': {
      branches: 25,
      functions: 30,
      lines: 35,
      statements: 30,
    },
    'src/stores/**/*.{ts,tsx}': {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

export default config;

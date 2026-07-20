import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/lib/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/validators/**/*.ts',
    'src/controllers/**/*.ts',
    'src/routes/**/*.ts',
    'src/events/**/*.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 30,
      lines: 35,
      statements: 30,
    },
    'src/services/**/*.ts': {
      branches: 30,
      functions: 35,
      lines: 40,
      statements: 35,
    },
    'src/lib/**/*.ts': {
      branches: 15,
      functions: 20,
      lines: 25,
      statements: 20,
    },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(otplib|@otplib|@scure|qrcode)/)',
  ],
};

export default config;

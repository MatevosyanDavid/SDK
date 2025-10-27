module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

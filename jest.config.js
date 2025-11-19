module.exports = {
  // Run tests from multiple projects in parallel
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/backend/**/*.test.js'],
      coveragePathIgnorePatterns: ['/node_modules/', '/public/'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup/backend-setup.js']
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/frontend/**/*.test.js'],
      coveragePathIgnorePatterns: ['/node_modules/', '/server.js', '/database.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup/frontend-setup.js'],
      testEnvironmentOptions: {
        url: 'http://localhost:3000'
      }
    }
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'server.js',
    'database.js',
    'public/app.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],

  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

// Backend test setup
// This file runs before each backend test

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory SQLite for tests

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// };

// Increase test timeout for database operations
jest.setTimeout(10000);

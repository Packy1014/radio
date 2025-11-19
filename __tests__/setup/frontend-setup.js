// Frontend test setup
// This file runs before each frontend test

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  fetch.mockClear();
  console.log.mockClear();
  console.error.mockClear();
  console.warn.mockClear();
});

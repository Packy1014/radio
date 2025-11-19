// Test helper functions and fixtures

// Test data fixtures
const testSongs = {
  song1: 'The Beatles_Hey Jude',
  song2: 'Pink Floyd_Comfortably Numb',
  song3: 'Queen_Bohemian Rhapsody'
};

const testUsers = {
  user1: 'user_1234567890_abc123',
  user2: 'user_0987654321_def456',
  user3: 'user_1111111111_ghi789'
};

// Mock fetch response helper
function mockFetchSuccess(data) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data)
  });
}

function mockFetchError(message = 'Network error', status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error: message })
  });
}

function mockFetchReject(error = 'Network failure') {
  return Promise.reject(new Error(error));
}

// Database test helper - creates fresh in-memory database
function createTestDatabase() {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');

  db.pragma('foreign_keys = ON');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS song_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS song_star_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON song_ratings(song_id);
  `);

  return db;
}

module.exports = {
  testSongs,
  testUsers,
  mockFetchSuccess,
  mockFetchError,
  mockFetchReject,
  createTestDatabase
};

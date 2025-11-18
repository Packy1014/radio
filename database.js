require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbPath = process.env.DATABASE_PATH || './data.db';
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database with example schema
 */
function initDatabase() {
  // Create users table as an example
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

    CREATE TABLE IF NOT EXISTS song_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON song_ratings(song_id);
  `);

  console.log('✓ Database initialized successfully');
}

/**
 * Get all users
 */
function getAllUsers() {
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  return stmt.all();
}

/**
 * Get user by ID
 */
function getUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * Create a new user
 */
function createUser(username, email) {
  const stmt = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
  const result = stmt.run(username, email);
  return result.lastInsertRowid;
}

/**
 * Get all posts with user information
 */
function getAllPosts() {
  const stmt = db.prepare(`
    SELECT posts.*, users.username
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `);
  return stmt.all();
}

/**
 * Create a new post
 */
function createPost(userId, title, content) {
  const stmt = db.prepare('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)');
  const result = stmt.run(userId, title, content);
  return result.lastInsertRowid;
}

/**
 * Submit or update a song rating
 * @param {string} songId - Unique identifier for the song (artist + title)
 * @param {string} userId - Unique identifier for the user
 * @param {number} rating - Rating value (1 for thumbs up, -1 for thumbs down)
 */
function submitRating(songId, userId, rating) {
  const stmt = db.prepare(`
    INSERT INTO song_ratings (song_id, user_id, rating)
    VALUES (?, ?, ?)
    ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
  `);
  const result = stmt.run(songId, userId, rating, rating);
  return result.changes > 0;
}

/**
 * Get rating counts for a song
 * @param {string} songId - Unique identifier for the song
 */
function getRatings(songId) {
  const stmt = db.prepare(`
    SELECT
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as thumbs_up,
      SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as thumbs_down
    FROM song_ratings
    WHERE song_id = ?
  `);
  const result = stmt.get(songId);
  return {
    thumbs_up: result.thumbs_up || 0,
    thumbs_down: result.thumbs_down || 0
  };
}

/**
 * Get user's rating for a song
 * @param {string} songId - Unique identifier for the song
 * @param {string} userId - Unique identifier for the user
 */
function getUserRating(songId, userId) {
  const stmt = db.prepare('SELECT rating FROM song_ratings WHERE song_id = ? AND user_id = ?');
  const result = stmt.get(songId, userId);
  return result ? result.rating : null;
}

/**
 * Test database connection
 */
function testConnection() {
  try {
    const result = db.prepare('SELECT 1 as test').get();
    return { success: true, message: 'Database connection successful', result };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Initialize database on first run
initDatabase();

// Export database instance and helper functions
module.exports = {
  db,
  initDatabase,
  getAllUsers,
  getUserById,
  createUser,
  getAllPosts,
  createPost,
  testConnection,
  submitRating,
  getRatings,
  getUserRating
};

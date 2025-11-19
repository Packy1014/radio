require('dotenv').config();

// Determine database type from environment
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

let dbInstance;

if (DATABASE_TYPE === 'postgres') {
  // PostgreSQL setup
  const { Pool } = require('pg');

  dbInstance = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'radio',
    user: process.env.POSTGRES_USER || 'radio',
    password: process.env.POSTGRES_PASSWORD || 'radio',
  });

  console.log('✓ Using PostgreSQL database');
} else {
  // SQLite setup
  const Database = require('better-sqlite3');
  const dbPath = process.env.DATABASE_PATH || './data.db';
  dbInstance = new Database(dbPath, { verbose: console.log });

  // Enable foreign keys for SQLite
  dbInstance.pragma('foreign_keys = ON');

  console.log('✓ Using SQLite database');
}

/**
 * Execute a query (abstraction layer for both SQLite and PostgreSQL)
 */
async function query(sql, params = []) {
  if (DATABASE_TYPE === 'postgres') {
    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await dbInstance.query(pgSql, params);
    return result.rows;
  } else {
    // SQLite - wrap synchronous calls in promises
    return new Promise((resolve, reject) => {
      try {
        const stmt = dbInstance.prepare(sql);
        const result = stmt.all(...params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Execute a query and return a single row
 */
async function queryOne(sql, params = []) {
  if (DATABASE_TYPE === 'postgres') {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await dbInstance.query(pgSql, params);
    return result.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      try {
        const stmt = dbInstance.prepare(sql);
        const result = stmt.get(...params);
        resolve(result || null);
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Execute an INSERT/UPDATE/DELETE and return affected rows
 */
async function execute(sql, params = []) {
  if (DATABASE_TYPE === 'postgres') {
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await dbInstance.query(pgSql, params);
    return {
      changes: result.rowCount,
      lastInsertRowid: result.rows[0]?.id || null
    };
  } else {
    return new Promise((resolve, reject) => {
      try {
        const stmt = dbInstance.prepare(sql);
        const result = stmt.run(...params);
        resolve({
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Initialize database with schema
 */
async function initDatabase() {
  try {
    if (DATABASE_TYPE === 'postgres') {
      // PostgreSQL schema
      await dbInstance.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

        CREATE TABLE IF NOT EXISTS song_ratings (
          id SERIAL PRIMARY KEY,
          song_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(song_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS song_star_ratings (
          id SERIAL PRIMARY KEY,
          song_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(song_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON song_ratings(song_id);
      `);
    } else {
      // SQLite schema
      dbInstance.exec(`
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
    }

    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get all users
 */
async function getAllUsers() {
  return await query('SELECT * FROM users ORDER BY created_at DESC');
}

/**
 * Get user by ID
 */
async function getUserById(id) {
  return await queryOne('SELECT * FROM users WHERE id = ?', [id]);
}

/**
 * Create a new user
 */
async function createUser(username, email) {
  if (DATABASE_TYPE === 'postgres') {
    const result = await dbInstance.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id',
      [username, email]
    );
    return result.rows[0].id;
  } else {
    const result = await execute('INSERT INTO users (username, email) VALUES (?, ?)', [username, email]);
    return result.lastInsertRowid;
  }
}

/**
 * Get all posts with user information
 */
async function getAllPosts() {
  return await query(`
    SELECT posts.*, users.username
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `);
}

/**
 * Create a new post
 */
async function createPost(userId, title, content) {
  if (DATABASE_TYPE === 'postgres') {
    const result = await dbInstance.query(
      'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id',
      [userId, title, content]
    );
    return result.rows[0].id;
  } else {
    const result = await execute('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)', [userId, title, content]);
    return result.lastInsertRowid;
  }
}

/**
 * Submit or update a song rating
 * @param {string} songId - Unique identifier for the song (artist + title)
 * @param {string} userId - Unique identifier for the user
 * @param {number} rating - Rating value (1 for thumbs up, -1 for thumbs down)
 */
async function submitRating(songId, userId, rating) {
  if (DATABASE_TYPE === 'postgres') {
    const result = await dbInstance.query(`
      INSERT INTO song_ratings (song_id, user_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT(song_id, user_id) DO UPDATE SET rating = $3, created_at = CURRENT_TIMESTAMP
    `, [songId, userId, rating]);
    return result.rowCount > 0;
  } else {
    const result = await execute(`
      INSERT INTO song_ratings (song_id, user_id, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
    `, [songId, userId, rating, rating]);
    return result.changes > 0;
  }
}

/**
 * Get rating counts for a song
 * @param {string} songId - Unique identifier for the song
 */
async function getRatings(songId) {
  const result = await queryOne(`
    SELECT
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as thumbs_up,
      SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as thumbs_down
    FROM song_ratings
    WHERE song_id = ?
  `, [songId]);

  return {
    thumbs_up: parseInt(result?.thumbs_up) || 0,
    thumbs_down: parseInt(result?.thumbs_down) || 0
  };
}

/**
 * Get user's rating for a song
 * @param {string} songId - Unique identifier for the song
 * @param {string} userId - Unique identifier for the user
 */
async function getUserRating(songId, userId) {
  const result = await queryOne('SELECT rating FROM song_ratings WHERE song_id = ? AND user_id = ?', [songId, userId]);
  return result ? result.rating : null;
}

/**
 * Submit or update a star rating (1-5)
 * @param {string} songId - Unique identifier for the song
 * @param {string} userId - Unique identifier for the user
 * @param {number} rating - Rating value (1-5 stars)
 */
async function submitStarRating(songId, userId, rating) {
  if (DATABASE_TYPE === 'postgres') {
    const result = await dbInstance.query(`
      INSERT INTO song_star_ratings (song_id, user_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT(song_id, user_id) DO UPDATE SET rating = $3, created_at = CURRENT_TIMESTAMP
    `, [songId, userId, rating]);
    return result.rowCount > 0;
  } else {
    const result = await execute(`
      INSERT INTO song_star_ratings (song_id, user_id, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
    `, [songId, userId, rating, rating]);
    return result.changes > 0;
  }
}

/**
 * Get star rating statistics for a song
 * @param {string} songId - Unique identifier for the song
 */
async function getStarRatings(songId) {
  const result = await queryOne(`
    SELECT
      AVG(rating) as average_rating,
      COUNT(*) as total_ratings
    FROM song_star_ratings
    WHERE song_id = ?
  `, [songId]);

  return {
    average_rating: result?.average_rating ? parseFloat(parseFloat(result.average_rating).toFixed(1)) : 0,
    total_ratings: parseInt(result?.total_ratings) || 0
  };
}

/**
 * Get user's star rating for a song
 * @param {string} songId - Unique identifier for the song
 * @param {string} userId - Unique identifier for the user
 */
async function getUserStarRating(songId, userId) {
  const result = await queryOne('SELECT rating FROM song_star_ratings WHERE song_id = ? AND user_id = ?', [songId, userId]);
  return result ? result.rating : null;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    if (DATABASE_TYPE === 'postgres') {
      await dbInstance.query('SELECT 1 as test');
    } else {
      dbInstance.prepare('SELECT 1 as test').get();
    }
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Initialize database on first run
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Export database instance and helper functions
module.exports = {
  db: dbInstance,
  initDatabase,
  getAllUsers,
  getUserById,
  createUser,
  getAllPosts,
  createPost,
  testConnection,
  submitRating,
  getRatings,
  getUserRating,
  submitStarRating,
  getStarRatings,
  getUserStarRating
};

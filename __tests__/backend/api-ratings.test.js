const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const { testSongs, testUsers } = require('../setup/test-helpers');

// Mock the database module
jest.mock('../../database.js', () => {
  const actualDb = jest.requireActual('better-sqlite3');
  let mockDb;

  return {
    submitRating: jest.fn((songId, userId, rating) => {
      const stmt = mockDb.prepare(`
        INSERT INTO song_ratings (song_id, user_id, rating)
        VALUES (?, ?, ?)
        ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
      `);
      const result = stmt.run(songId, userId, rating, rating);
      return result.changes > 0;
    }),
    getRatings: jest.fn((songId) => {
      const stmt = mockDb.prepare(`
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
    }),
    getUserRating: jest.fn((songId, userId) => {
      const stmt = mockDb.prepare('SELECT rating FROM song_ratings WHERE song_id = ? AND user_id = ?');
      const result = stmt.get(songId, userId);
      return result ? result.rating : null;
    }),
    _setMockDb: (db) => { mockDb = db; }
  };
});

const { submitRating, getRatings, getUserRating } = require('../../database.js');

describe('API Endpoints - Thumbs Up/Down Ratings', () => {
  let app;
  let db;

  beforeEach(() => {
    // Create fresh in-memory database
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE song_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_id, user_id)
      );
      CREATE INDEX idx_ratings_song_id ON song_ratings(song_id);
    `);

    // Set mock database
    require('../../database.js')._setMockDb(db);

    // Create Express app with rating routes
    app = express();
    app.use(express.json());

    // POST /api/ratings
    app.post('/api/ratings', (req, res) => {
      try {
        const { songId, userId, rating } = req.body;
        if (!songId || !userId || (rating !== 1 && rating !== -1)) {
          return res.status(400).json({
            success: false,
            error: 'Song ID, user ID, and rating (1 or -1) are required'
          });
        }
        const success = submitRating(songId, userId, rating);
        res.json({
          success,
          message: success ? 'Rating submitted successfully' : 'Rating submission failed'
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/ratings/:songId
    app.get('/api/ratings/:songId', (req, res) => {
      try {
        const { songId } = req.params;
        const { userId } = req.query;

        const ratings = getRatings(songId);
        const userRating = userId ? getUserRating(songId, userId) : null;

        res.json({
          success: true,
          data: {
            ...ratings,
            userRating
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

  afterEach(() => {
    db.close();
    jest.clearAllMocks();
  });

  describe('POST /api/ratings', () => {
    test('should submit thumbs up rating successfully', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Rating submitted successfully'
      });
      expect(submitRating).toHaveBeenCalledWith(testSongs.song1, testUsers.user1, 1);
    });

    test('should submit thumbs down rating successfully', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: -1
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Rating submitted successfully'
      });
      expect(submitRating).toHaveBeenCalledWith(testSongs.song1, testUsers.user1, -1);
    });

    test('should return 400 when songId is missing', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          userId: testUsers.user1,
          rating: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1 or -1) are required'
      });
      expect(submitRating).not.toHaveBeenCalled();
    });

    test('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          rating: 1
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1 or -1) are required'
      });
      expect(submitRating).not.toHaveBeenCalled();
    });

    test('should return 400 when rating is missing', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 when rating is 0', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1 or -1) are required'
      });
    });

    test('should return 400 when rating is 2', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 2
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1 or -1) are required'
      });
    });

    test('should return 400 when rating is string', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: "thumbs_up"
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 500 when database throws error', async () => {
      submitRating.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 1
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Database connection failed'
      });
    });

    test('should handle special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      const response = await request(app)
        .post('/api/ratings')
        .send({
          songId: specialSongId,
          userId: testUsers.user1,
          rating: 1
        });

      expect(response.status).toBe(200);
      expect(submitRating).toHaveBeenCalledWith(specialSongId, testUsers.user1, 1);
    });
  });

  describe('GET /api/ratings/:songId', () => {
    beforeEach(() => {
      // Pre-populate some ratings
      submitRating(testSongs.song1, testUsers.user1, 1);
      submitRating(testSongs.song1, testUsers.user2, 1);
      submitRating(testSongs.song1, testUsers.user3, -1);
    });

    test('should get ratings without userId', async () => {
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSongs.song1)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          thumbs_up: 2,
          thumbs_down: 1,
          userRating: null
        }
      });
      expect(getRatings).toHaveBeenCalledWith(testSongs.song1);
      expect(getUserRating).not.toHaveBeenCalled();
    });

    test('should get ratings with userId showing user thumbs up', async () => {
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSongs.song1)}?userId=${testUsers.user1}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          thumbs_up: 2,
          thumbs_down: 1,
          userRating: 1
        }
      });
      expect(getUserRating).toHaveBeenCalledWith(testSongs.song1, testUsers.user1);
    });

    test('should get ratings with userId showing user thumbs down', async () => {
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSongs.song1)}?userId=${testUsers.user3}`);

      expect(response.status).toBe(200);
      expect(response.body.data.userRating).toBe(-1);
    });

    test('should return null userRating for user who hasnt rated', async () => {
      const newUser = 'user_999_new';
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSongs.song1)}?userId=${newUser}`);

      expect(response.status).toBe(200);
      expect(response.body.data.userRating).toBeNull();
    });

    test('should return zero counts for song with no ratings', async () => {
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSongs.song2)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          thumbs_up: 0,
          thumbs_down: 0,
          userRating: null
        }
      });
    });

    test('should handle special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      submitRating(specialSongId, testUsers.user1, 1);

      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(specialSongId)}`);

      expect(response.status).toBe(200);
      expect(getRatings).toHaveBeenCalledWith(specialSongId);
    });

    test('should return 500 when database throws error', async () => {
      getRatings.mockImplementationOnce(() => {
        throw new Error('Database query failed');
      });

      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSongs.song1)}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Database query failed'
      });
    });
  });
});

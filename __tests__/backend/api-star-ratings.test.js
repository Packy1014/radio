const request = require('supertest');
const express = require('express');
const Database = require('better-sqlite3');
const { testSongs, testUsers } = require('../setup/test-helpers');

// Mock the database module
jest.mock('../../database.js', () => {
  const actualDb = jest.requireActual('better-sqlite3');
  let mockDb;

  return {
    submitStarRating: jest.fn((songId, userId, rating) => {
      const stmt = mockDb.prepare(`
        INSERT INTO song_star_ratings (song_id, user_id, rating)
        VALUES (?, ?, ?)
        ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
      `);
      const result = stmt.run(songId, userId, rating, rating);
      return result.changes > 0;
    }),
    getStarRatings: jest.fn((songId) => {
      const stmt = mockDb.prepare(`
        SELECT
          AVG(rating) as average_rating,
          COUNT(*) as total_ratings
        FROM song_star_ratings
        WHERE song_id = ?
      `);
      const result = stmt.get(songId);
      return {
        average_rating: result.average_rating ? parseFloat(result.average_rating.toFixed(1)) : 0,
        total_ratings: result.total_ratings || 0
      };
    }),
    getUserStarRating: jest.fn((songId, userId) => {
      const stmt = mockDb.prepare('SELECT rating FROM song_star_ratings WHERE song_id = ? AND user_id = ?');
      const result = stmt.get(songId, userId);
      return result ? result.rating : null;
    }),
    _setMockDb: (db) => { mockDb = db; }
  };
});

const { submitStarRating, getStarRatings, getUserStarRating } = require('../../database.js');

describe('API Endpoints - Star Ratings (1-5)', () => {
  let app;
  let db;

  beforeEach(() => {
    // Create fresh in-memory database
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE song_star_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_id, user_id)
      );
    `);

    // Set mock database
    require('../../database.js')._setMockDb(db);

    // Create Express app with star rating routes
    app = express();
    app.use(express.json());

    // POST /api/star-ratings
    app.post('/api/star-ratings', (req, res) => {
      try {
        const { songId, userId, rating } = req.body;
        if (!songId || !userId || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({
            success: false,
            error: 'Song ID, user ID, and rating (1-5) are required'
          });
        }
        const success = submitStarRating(songId, userId, rating);
        res.json({
          success,
          message: success ? 'Star rating submitted successfully' : 'Star rating submission failed'
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/star-ratings/:songId
    app.get('/api/star-ratings/:songId', (req, res) => {
      try {
        const { songId } = req.params;
        const { userId } = req.query;

        const ratings = getStarRatings(songId);
        const userRating = userId ? getUserStarRating(songId, userId) : null;

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

  describe('POST /api/star-ratings', () => {
    test('should submit 1-star rating successfully', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Star rating submitted successfully'
      });
      expect(submitStarRating).toHaveBeenCalledWith(testSongs.song1, testUsers.user1, 1);
    });

    test('should submit 5-star rating successfully', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 5
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Star rating submitted successfully'
      });
      expect(submitStarRating).toHaveBeenCalledWith(testSongs.song1, testUsers.user1, 5);
    });

    test('should submit 3-star rating successfully', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 3
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 400 when songId is missing', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          userId: testUsers.user1,
          rating: 3
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1-5) are required'
      });
      expect(submitStarRating).not.toHaveBeenCalled();
    });

    test('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          rating: 3
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1-5) are required'
      });
      expect(submitStarRating).not.toHaveBeenCalled();
    });

    test('should return 400 when rating is missing', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 when rating is 0', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1-5) are required'
      });
    });

    test('should return 400 when rating is 6', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 6
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Song ID, user ID, and rating (1-5) are required'
      });
    });

    test('should return 400 when rating is negative', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: -1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 when rating is string', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: "five"
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 when rating is decimal', async () => {
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 3.5
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 500 when database throws error', async () => {
      submitStarRating.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 3
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
        .post('/api/star-ratings')
        .send({
          songId: specialSongId,
          userId: testUsers.user1,
          rating: 4
        });

      expect(response.status).toBe(200);
      expect(submitStarRating).toHaveBeenCalledWith(specialSongId, testUsers.user1, 4);
    });

    test('should update existing rating', async () => {
      // Submit initial rating
      await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 3
        });

      // Update rating
      const response = await request(app)
        .post('/api/star-ratings')
        .send({
          songId: testSongs.song1,
          userId: testUsers.user1,
          rating: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/star-ratings/:songId', () => {
    beforeEach(() => {
      // Pre-populate some star ratings
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song1, testUsers.user2, 4);
      submitStarRating(testSongs.song1, testUsers.user3, 3);
    });

    test('should get star ratings without userId', async () => {
      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song1)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          average_rating: 4.0, // (5+4+3)/3 = 4.0
          total_ratings: 3,
          userRating: null
        }
      });
      expect(getStarRatings).toHaveBeenCalledWith(testSongs.song1);
      expect(getUserStarRating).not.toHaveBeenCalled();
    });

    test('should get star ratings with userId showing user rating', async () => {
      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song1)}?userId=${testUsers.user1}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          average_rating: 4.0,
          total_ratings: 3,
          userRating: 5
        }
      });
      expect(getUserStarRating).toHaveBeenCalledWith(testSongs.song1, testUsers.user1);
    });

    test('should return null userRating for user who hasnt rated', async () => {
      const newUser = 'user_999_new';
      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song1)}?userId=${newUser}`);

      expect(response.status).toBe(200);
      expect(response.body.data.userRating).toBeNull();
    });

    test('should return zero values for song with no ratings', async () => {
      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song2)}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          average_rating: 0,
          total_ratings: 0,
          userRating: null
        }
      });
    });

    test('should handle single rating correctly', async () => {
      submitStarRating(testSongs.song2, testUsers.user1, 5);

      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song2)}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        average_rating: 5.0,
        total_ratings: 1,
        userRating: null
      });
    });

    test('should handle special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      submitStarRating(specialSongId, testUsers.user1, 4);

      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(specialSongId)}`);

      expect(response.status).toBe(200);
      expect(getStarRatings).toHaveBeenCalledWith(specialSongId);
    });

    test('should return 500 when database throws error', async () => {
      getStarRatings.mockImplementationOnce(() => {
        throw new Error('Database query failed');
      });

      const response = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song1)}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Database query failed'
      });
    });

    test('should return different ratings for different songs', async () => {
      submitStarRating(testSongs.song2, testUsers.user1, 1);

      const response1 = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song1)}`);
      const response2 = await request(app)
        .get(`/api/star-ratings/${encodeURIComponent(testSongs.song2)}`);

      expect(response1.body.data.average_rating).toBe(4.0);
      expect(response2.body.data.average_rating).toBe(1.0);
    });
  });
});

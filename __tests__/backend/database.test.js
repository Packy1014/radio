const Database = require('better-sqlite3');
const { testSongs, testUsers } = require('../setup/test-helpers');

describe('Database Layer - Ratings Functions', () => {
  let db;
  let submitRating;
  let getRatings;
  let getUserRating;
  let submitStarRating;
  let getStarRatings;
  let getUserStarRating;

  beforeEach(() => {
    // Create fresh in-memory database for each test
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // Initialize tables
    db.exec(`
      CREATE TABLE song_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_id, user_id)
      );

      CREATE TABLE song_star_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_id, user_id)
      );

      CREATE INDEX idx_ratings_song_id ON song_ratings(song_id);
    `);

    // Define rating functions inline (same logic as database.js)
    submitRating = (songId, userId, rating) => {
      const stmt = db.prepare(`
        INSERT INTO song_ratings (song_id, user_id, rating)
        VALUES (?, ?, ?)
        ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
      `);
      const result = stmt.run(songId, userId, rating, rating);
      return result.changes > 0;
    };

    getRatings = (songId) => {
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
    };

    getUserRating = (songId, userId) => {
      const stmt = db.prepare('SELECT rating FROM song_ratings WHERE song_id = ? AND user_id = ?');
      const result = stmt.get(songId, userId);
      return result ? result.rating : null;
    };

    submitStarRating = (songId, userId, rating) => {
      const stmt = db.prepare(`
        INSERT INTO song_star_ratings (song_id, user_id, rating)
        VALUES (?, ?, ?)
        ON CONFLICT(song_id, user_id) DO UPDATE SET rating = ?, created_at = CURRENT_TIMESTAMP
      `);
      const result = stmt.run(songId, userId, rating, rating);
      return result.changes > 0;
    };

    getStarRatings = (songId) => {
      const stmt = db.prepare(`
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
    };

    getUserStarRating = (songId, userId) => {
      const stmt = db.prepare('SELECT rating FROM song_star_ratings WHERE song_id = ? AND user_id = ?');
      const result = stmt.get(songId, userId);
      return result ? result.rating : null;
    };
  });

  afterEach(() => {
    db.close();
  });

  describe('submitRating()', () => {
    test('should insert new thumbs up rating', () => {
      const result = submitRating(testSongs.song1, testUsers.user1, 1);

      expect(result).toBe(true);
      const userRating = getUserRating(testSongs.song1, testUsers.user1);
      expect(userRating).toBe(1);
    });

    test('should insert new thumbs down rating', () => {
      const result = submitRating(testSongs.song1, testUsers.user1, -1);

      expect(result).toBe(true);
      const userRating = getUserRating(testSongs.song1, testUsers.user1);
      expect(userRating).toBe(-1);
    });

    test('should update existing rating from thumbs up to thumbs down', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      const result = submitRating(testSongs.song1, testUsers.user1, -1);

      expect(result).toBe(true);
      const userRating = getUserRating(testSongs.song1, testUsers.user1);
      expect(userRating).toBe(-1);
    });

    test('should update existing rating from thumbs down to thumbs up', () => {
      submitRating(testSongs.song1, testUsers.user1, -1);
      const result = submitRating(testSongs.song1, testUsers.user1, 1);

      expect(result).toBe(true);
      const userRating = getUserRating(testSongs.song1, testUsers.user1);
      expect(userRating).toBe(1);
    });

    test('should reject invalid rating value (0)', () => {
      expect(() => {
        submitRating(testSongs.song1, testUsers.user1, 0);
      }).toThrow();
    });

    test('should reject invalid rating value (2)', () => {
      expect(() => {
        submitRating(testSongs.song1, testUsers.user1, 2);
      }).toThrow();
    });

    test('should allow different users to rate same song', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      submitRating(testSongs.song1, testUsers.user2, -1);

      expect(getUserRating(testSongs.song1, testUsers.user1)).toBe(1);
      expect(getUserRating(testSongs.song1, testUsers.user2)).toBe(-1);
    });

    test('should allow same user to rate different songs', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      submitRating(testSongs.song2, testUsers.user1, -1);

      expect(getUserRating(testSongs.song1, testUsers.user1)).toBe(1);
      expect(getUserRating(testSongs.song2, testUsers.user1)).toBe(-1);
    });
  });

  describe('getRatings()', () => {
    test('should return zero counts for song with no ratings', () => {
      const ratings = getRatings(testSongs.song1);

      expect(ratings).toEqual({
        thumbs_up: 0,
        thumbs_down: 0
      });
    });

    test('should count single thumbs up rating', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      const ratings = getRatings(testSongs.song1);

      expect(ratings).toEqual({
        thumbs_up: 1,
        thumbs_down: 0
      });
    });

    test('should count single thumbs down rating', () => {
      submitRating(testSongs.song1, testUsers.user1, -1);
      const ratings = getRatings(testSongs.song1);

      expect(ratings).toEqual({
        thumbs_up: 0,
        thumbs_down: 1
      });
    });

    test('should count multiple mixed ratings', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      submitRating(testSongs.song1, testUsers.user2, 1);
      submitRating(testSongs.song1, testUsers.user3, -1);

      const ratings = getRatings(testSongs.song1);

      expect(ratings).toEqual({
        thumbs_up: 2,
        thumbs_down: 1
      });
    });

    test('should not count ratings from different songs', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      submitRating(testSongs.song2, testUsers.user2, -1);

      const ratings1 = getRatings(testSongs.song1);
      const ratings2 = getRatings(testSongs.song2);

      expect(ratings1).toEqual({ thumbs_up: 1, thumbs_down: 0 });
      expect(ratings2).toEqual({ thumbs_up: 0, thumbs_down: 1 });
    });

    test('should update counts when user changes rating', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      let ratings = getRatings(testSongs.song1);
      expect(ratings).toEqual({ thumbs_up: 1, thumbs_down: 0 });

      submitRating(testSongs.song1, testUsers.user1, -1);
      ratings = getRatings(testSongs.song1);
      expect(ratings).toEqual({ thumbs_up: 0, thumbs_down: 1 });
    });
  });

  describe('getUserRating()', () => {
    test('should return null for user with no rating', () => {
      const rating = getUserRating(testSongs.song1, testUsers.user1);
      expect(rating).toBeNull();
    });

    test('should return users thumbs up rating', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      const rating = getUserRating(testSongs.song1, testUsers.user1);
      expect(rating).toBe(1);
    });

    test('should return users thumbs down rating', () => {
      submitRating(testSongs.song1, testUsers.user1, -1);
      const rating = getUserRating(testSongs.song1, testUsers.user1);
      expect(rating).toBe(-1);
    });

    test('should return correct rating for specific user', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      submitRating(testSongs.song1, testUsers.user2, -1);

      expect(getUserRating(testSongs.song1, testUsers.user1)).toBe(1);
      expect(getUserRating(testSongs.song1, testUsers.user2)).toBe(-1);
    });

    test('should return null for different song', () => {
      submitRating(testSongs.song1, testUsers.user1, 1);
      const rating = getUserRating(testSongs.song2, testUsers.user1);
      expect(rating).toBeNull();
    });
  });

  describe('submitStarRating()', () => {
    test('should insert 1-star rating', () => {
      const result = submitStarRating(testSongs.song1, testUsers.user1, 1);
      expect(result).toBe(true);
      expect(getUserStarRating(testSongs.song1, testUsers.user1)).toBe(1);
    });

    test('should insert 5-star rating', () => {
      const result = submitStarRating(testSongs.song1, testUsers.user1, 5);
      expect(result).toBe(true);
      expect(getUserStarRating(testSongs.song1, testUsers.user1)).toBe(5);
    });

    test('should insert 3-star rating', () => {
      const result = submitStarRating(testSongs.song1, testUsers.user1, 3);
      expect(result).toBe(true);
      expect(getUserStarRating(testSongs.song1, testUsers.user1)).toBe(3);
    });

    test('should update existing star rating', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 3);
      const result = submitStarRating(testSongs.song1, testUsers.user1, 5);

      expect(result).toBe(true);
      expect(getUserStarRating(testSongs.song1, testUsers.user1)).toBe(5);
    });

    test('should reject rating below 1', () => {
      expect(() => {
        submitStarRating(testSongs.song1, testUsers.user1, 0);
      }).toThrow();
    });

    test('should reject rating above 5', () => {
      expect(() => {
        submitStarRating(testSongs.song1, testUsers.user1, 6);
      }).toThrow();
    });

    test('should allow multiple users to rate same song', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song1, testUsers.user2, 3);

      expect(getUserStarRating(testSongs.song1, testUsers.user1)).toBe(5);
      expect(getUserStarRating(testSongs.song1, testUsers.user2)).toBe(3);
    });
  });

  describe('getStarRatings()', () => {
    test('should return zero for song with no ratings', () => {
      const ratings = getStarRatings(testSongs.song1);

      expect(ratings).toEqual({
        average_rating: 0,
        total_ratings: 0
      });
    });

    test('should return correct average for single rating', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 4);
      const ratings = getStarRatings(testSongs.song1);

      expect(ratings).toEqual({
        average_rating: 4.0,
        total_ratings: 1
      });
    });

    test('should calculate average of multiple ratings', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song1, testUsers.user2, 3);
      submitStarRating(testSongs.song1, testUsers.user3, 4);

      const ratings = getStarRatings(testSongs.song1);

      expect(ratings.average_rating).toBe(4.0); // (5+3+4)/3 = 4.0
      expect(ratings.total_ratings).toBe(3);
    });

    test('should round average to 1 decimal place', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song1, testUsers.user2, 4);

      const ratings = getStarRatings(testSongs.song1);

      expect(ratings.average_rating).toBe(4.5); // (5+4)/2 = 4.5
    });

    test('should update average when user changes rating', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song1, testUsers.user2, 5);

      let ratings = getStarRatings(testSongs.song1);
      expect(ratings.average_rating).toBe(5.0);

      submitStarRating(testSongs.song1, testUsers.user1, 1);
      ratings = getStarRatings(testSongs.song1);
      expect(ratings.average_rating).toBe(3.0); // (1+5)/2
      expect(ratings.total_ratings).toBe(2); // Still 2 users
    });

    test('should not include ratings from different songs', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song2, testUsers.user2, 1);

      const ratings1 = getStarRatings(testSongs.song1);
      const ratings2 = getStarRatings(testSongs.song2);

      expect(ratings1).toEqual({ average_rating: 5.0, total_ratings: 1 });
      expect(ratings2).toEqual({ average_rating: 1.0, total_ratings: 1 });
    });
  });

  describe('getUserStarRating()', () => {
    test('should return null for user with no rating', () => {
      const rating = getUserStarRating(testSongs.song1, testUsers.user1);
      expect(rating).toBeNull();
    });

    test('should return users star rating', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 4);
      const rating = getUserStarRating(testSongs.song1, testUsers.user1);
      expect(rating).toBe(4);
    });

    test('should return correct rating for specific user', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      submitStarRating(testSongs.song1, testUsers.user2, 2);

      expect(getUserStarRating(testSongs.song1, testUsers.user1)).toBe(5);
      expect(getUserStarRating(testSongs.song1, testUsers.user2)).toBe(2);
    });

    test('should return null for different song', () => {
      submitStarRating(testSongs.song1, testUsers.user1, 5);
      const rating = getUserStarRating(testSongs.song2, testUsers.user1);
      expect(rating).toBeNull();
    });
  });
});

/**
 * Frontend Star Ratings Tests (1-5)
 * Tests the star rating functions from app.js
 */

const { mockFetchSuccess, mockFetchError, mockFetchReject, testSongs, testUsers } = require('../setup/test-helpers');

describe('Frontend Star Ratings (1-5 Stars)', () => {
  let getUserId;
  let loadStarRatings;
  let submitStarRating;
  let updateStarDisplay;
  let currentSongId;

  // Mock DOM elements
  let starRatingContainer;
  let stars;

  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div id="starRating">
        <span class="star empty" data-index="0">★</span>
        <span class="star empty" data-index="1">★</span>
        <span class="star empty" data-index="2">★</span>
        <span class="star empty" data-index="3">★</span>
        <span class="star empty" data-index="4">★</span>
      </div>
    `;

    starRatingContainer = document.getElementById('starRating');
    stars = starRatingContainer.querySelectorAll('.star');
    currentSongId = null;

    // Define functions (extracted from app.js)
    getUserId = function() {
      let userId = localStorage.getItem('radioUserId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('radioUserId', userId);
      }
      return userId;
    };

    loadStarRatings = async function(songId) {
      try {
        const userId = getUserId();
        const response = await fetch(`/api/star-ratings/${encodeURIComponent(songId)}?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();

        if (data.success) {
          updateStarDisplay(data.data.userRating || 0);
        }
      } catch (error) {
        console.error('Error loading star ratings:', error);
      }
    };

    submitStarRating = async function(songId, rating) {
      try {
        const userId = getUserId();
        const response = await fetch('/api/star-ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ songId, userId, rating })
        });

        const data = await response.json();

        if (data.success) {
          updateStarDisplay(rating);
        }
      } catch (error) {
        console.error('Error submitting star rating:', error);
      }
    };

    updateStarDisplay = function(rating) {
      const stars = starRatingContainer.querySelectorAll('.star');
      stars.forEach((star, index) => {
        if (index < rating) {
          star.classList.remove('empty');
        } else {
          star.classList.add('empty');
        }
      });
    };

    // Reset fetch mock
    fetch.mockClear();
  });

  describe('updateStarDisplay()', () => {
    test('should fill no stars for rating 0', () => {
      updateStarDisplay(0);

      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(true);
      });
    });

    test('should fill 1 star for rating 1', () => {
      updateStarDisplay(1);

      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(true);
      expect(stars[2].classList.contains('empty')).toBe(true);
      expect(stars[3].classList.contains('empty')).toBe(true);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should fill 3 stars for rating 3', () => {
      updateStarDisplay(3);

      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
      expect(stars[3].classList.contains('empty')).toBe(true);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should fill all 5 stars for rating 5', () => {
      updateStarDisplay(5);

      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(false);
      });
    });

    test('should update from higher to lower rating', () => {
      updateStarDisplay(5);
      updateStarDisplay(2);

      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(true);
      expect(stars[3].classList.contains('empty')).toBe(true);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should update from lower to higher rating', () => {
      updateStarDisplay(2);
      updateStarDisplay(4);

      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
      expect(stars[3].classList.contains('empty')).toBe(false);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should clear all stars when rating changes to 0', () => {
      updateStarDisplay(4);
      updateStarDisplay(0);

      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(true);
      });
    });
  });

  describe('loadStarRatings()', () => {
    test('should fetch star ratings from API with correct URL', async () => {
      const mockData = {
        success: true,
        data: {
          average_rating: 4.5,
          total_ratings: 10,
          userRating: 5
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(testSongs.song1);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/star-ratings/${encodeURIComponent(testSongs.song1)}`)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=')
      );
    });

    test('should update star display with user rating', async () => {
      const mockData = {
        success: true,
        data: {
          average_rating: 4.0,
          total_ratings: 5,
          userRating: 3
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(testSongs.song1);

      // Check that 3 stars are filled
      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
      expect(stars[3].classList.contains('empty')).toBe(true);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should show no stars when userRating is null', async () => {
      const mockData = {
        success: true,
        data: {
          average_rating: 4.0,
          total_ratings: 5,
          userRating: null
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(testSongs.song1);

      // All stars should be empty
      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(true);
      });
    });

    test('should handle zero user rating', async () => {
      const mockData = {
        success: true,
        data: {
          average_rating: 3.0,
          total_ratings: 2,
          userRating: 0
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(testSongs.song1);

      // All stars should be empty for rating 0
      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(true);
      });
    });

    test('should encode special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      const mockData = {
        success: true,
        data: { average_rating: 4.0, total_ratings: 1, userRating: 4 }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(specialSongId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(specialSongId))
      );
    });

    test('should include userId in query string', async () => {
      const mockData = {
        success: true,
        data: { average_rating: 4.0, total_ratings: 1, userRating: null }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      const userId = getUserId();
      await loadStarRatings(testSongs.song1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`userId=${encodeURIComponent(userId)}`)
      );
    });

    test('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await loadStarRatings(testSongs.song1);

      expect(console.error).toHaveBeenCalledWith(
        'Error loading star ratings:',
        expect.any(Error)
      );
    });

    test('should not update display when API returns error', async () => {
      // Set initial state
      updateStarDisplay(3);

      const mockData = {
        success: false,
        error: 'Database error'
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(testSongs.song1);

      // Display should remain unchanged (still 3 stars)
      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
    });
  });

  describe('submitStarRating()', () => {
    test('should send POST request with correct data for 1 star', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 1);

      expect(fetch).toHaveBeenCalledWith(
        '/api/star-ratings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.songId).toBe(testSongs.song1);
      expect(body.rating).toBe(1);
      expect(body.userId).toBeDefined();
    });

    test('should send POST request with correct data for 5 stars', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 5);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.rating).toBe(5);
    });

    test('should send POST request with correct data for 3 stars', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 3);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.rating).toBe(3);
    });

    test('should include userId from getUserId()', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      const userId = getUserId();
      await submitStarRating(testSongs.song1, 4);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.userId).toBe(userId);
    });

    test('should update star display after successful submission', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 4);

      // Check that 4 stars are filled
      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
      expect(stars[3].classList.contains('empty')).toBe(false);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should not update display when submission fails', async () => {
      // Set initial state
      updateStarDisplay(3);

      const mockResponse = { success: false };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 5);

      // Display should remain unchanged (still 3 stars)
      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
      expect(stars[3].classList.contains('empty')).toBe(true);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await submitStarRating(testSongs.song1, 3);

      expect(console.error).toHaveBeenCalledWith(
        'Error submitting star rating:',
        expect.any(Error)
      );
    });

    test('should send correct Content-Type header', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 3);

      const callArgs = fetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });

    test('should handle special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(specialSongId, 4);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.songId).toBe(specialSongId);
    });
  });

  describe('Star Rating Flow Integration', () => {
    test('complete flow: submit rating and update UI', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

      await submitStarRating(testSongs.song1, 4);

      // Check that 4 stars are filled
      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(false);
      expect(stars[3].classList.contains('empty')).toBe(false);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('should handle changing rating from 2 to 5 stars', async () => {
      // First rating: 2 stars
      fetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));
      await submitStarRating(testSongs.song1, 2);

      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(true);

      // Second rating: change to 5 stars
      fetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));
      await submitStarRating(testSongs.song1, 5);

      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(false);
      });
    });

    test('should handle changing rating from 5 to 1 star', async () => {
      // First rating: 5 stars
      fetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));
      await submitStarRating(testSongs.song1, 5);

      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(false);
      });

      // Second rating: change to 1 star
      fetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));
      await submitStarRating(testSongs.song1, 1);

      expect(stars[0].classList.contains('empty')).toBe(false);
      expect(stars[1].classList.contains('empty')).toBe(true);
      expect(stars[2].classList.contains('empty')).toBe(true);
      expect(stars[3].classList.contains('empty')).toBe(true);
      expect(stars[4].classList.contains('empty')).toBe(true);
    });

    test('load and display existing rating', async () => {
      const mockData = {
        success: true,
        data: {
          average_rating: 4.2,
          total_ratings: 15,
          userRating: 5
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadStarRatings(testSongs.song1);

      // All 5 stars should be filled
      stars.forEach(star => {
        expect(star.classList.contains('empty')).toBe(false);
      });
    });

    test('should handle rating multiple different songs', async () => {
      // Rate song1
      fetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));
      await submitStarRating(testSongs.song1, 4);
      expect(stars[3].classList.contains('empty')).toBe(false);

      // Rate song2
      fetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));
      await submitStarRating(testSongs.song2, 2);
      expect(stars[1].classList.contains('empty')).toBe(false);
      expect(stars[2].classList.contains('empty')).toBe(true);

      // Load song1 rating
      fetch.mockResolvedValueOnce(mockFetchSuccess({
        success: true,
        data: { average_rating: 4.0, total_ratings: 1, userRating: 4 }
      }));
      await loadStarRatings(testSongs.song1);
      expect(stars[3].classList.contains('empty')).toBe(false);
    });
  });
});

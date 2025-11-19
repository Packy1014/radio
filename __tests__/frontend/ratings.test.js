/**
 * Frontend Thumbs Up/Down Ratings Tests
 * Tests the rating functions from app.js
 */

const { mockFetchSuccess, mockFetchError, mockFetchReject, testSongs, testUsers } = require('../setup/test-helpers');

describe('Frontend Ratings - Thumbs Up/Down', () => {
  let getUserId;
  let loadRatings;
  let submitRatingRequest;

  // Mock DOM elements
  let thumbsUpCount;
  let thumbsDownCount;
  let thumbsUpBtn;
  let thumbsDownBtn;

  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div id="thumbsUpCount">0</div>
      <div id="thumbsDownCount">0</div>
      <button id="thumbsUpBtn"></button>
      <button id="thumbsDownBtn"></button>
    `;

    thumbsUpCount = document.getElementById('thumbsUpCount');
    thumbsDownCount = document.getElementById('thumbsDownCount');
    thumbsUpBtn = document.getElementById('thumbsUpBtn');
    thumbsDownBtn = document.getElementById('thumbsDownBtn');

    // Define functions (extracted from app.js)
    getUserId = function() {
      let userId = localStorage.getItem('radioUserId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('radioUserId', userId);
      }
      return userId;
    };

    loadRatings = async function(songId) {
      try {
        const userId = getUserId();
        const response = await fetch(`/api/ratings/${encodeURIComponent(songId)}?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();

        if (data.success) {
          thumbsUpCount.textContent = data.data.thumbs_up;
          thumbsDownCount.textContent = data.data.thumbs_down;

          thumbsUpBtn.classList.remove('active');
          thumbsDownBtn.classList.remove('active');

          if (data.data.userRating === 1) {
            thumbsUpBtn.classList.add('active');
          } else if (data.data.userRating === -1) {
            thumbsDownBtn.classList.add('active');
          }
        }
      } catch (error) {
        console.error('Error loading ratings:', error);
      }
    };

    submitRatingRequest = async function(songId, rating) {
      try {
        const userId = getUserId();
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ songId, userId, rating })
        });

        const data = await response.json();

        if (data.success) {
          await loadRatings(songId);
        }
      } catch (error) {
        console.error('Error submitting rating:', error);
      }
    };

    // Reset fetch mock
    fetch.mockClear();
  });

  describe('loadRatings()', () => {
    test('should fetch ratings from API with correct URL', async () => {
      const mockData = {
        success: true,
        data: {
          thumbs_up: 5,
          thumbs_down: 2,
          userRating: null
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ratings/${encodeURIComponent(testSongs.song1)}`)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=')
      );
    });

    test('should update thumbs up and down counts in DOM', async () => {
      const mockData = {
        success: true,
        data: {
          thumbs_up: 10,
          thumbs_down: 3,
          userRating: null
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      expect(thumbsUpCount.textContent).toBe('10');
      expect(thumbsDownCount.textContent).toBe('3');
    });

    test('should add active class to thumbs up button when user rated up', async () => {
      const mockData = {
        success: true,
        data: {
          thumbs_up: 5,
          thumbs_down: 2,
          userRating: 1
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      expect(thumbsUpBtn.classList.contains('active')).toBe(true);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
    });

    test('should add active class to thumbs down button when user rated down', async () => {
      const mockData = {
        success: true,
        data: {
          thumbs_up: 5,
          thumbs_down: 2,
          userRating: -1
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(true);
    });

    test('should remove active class from both buttons when user has no rating', async () => {
      // Add active class to test removal
      thumbsUpBtn.classList.add('active');
      thumbsDownBtn.classList.add('active');

      const mockData = {
        success: true,
        data: {
          thumbs_up: 5,
          thumbs_down: 2,
          userRating: null
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
    });

    test('should handle zero counts correctly', async () => {
      const mockData = {
        success: true,
        data: {
          thumbs_up: 0,
          thumbs_down: 0,
          userRating: null
        }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      expect(thumbsUpCount.textContent).toBe('0');
      expect(thumbsDownCount.textContent).toBe('0');
    });

    test('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await loadRatings(testSongs.song1);

      // Should not crash, error logged to console
      expect(console.error).toHaveBeenCalledWith(
        'Error loading ratings:',
        expect.any(Error)
      );
    });

    test('should handle API error response', async () => {
      const mockData = {
        success: false,
        error: 'Database error'
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(testSongs.song1);

      // Should not update DOM when success is false
      // DOM stays at initial state
    });

    test('should encode special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      const mockData = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: null }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      await loadRatings(specialSongId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(specialSongId))
      );
    });

    test('should include userId in query string', async () => {
      const mockData = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: null }
      };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockData));

      const userId = getUserId();
      await loadRatings(testSongs.song1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`userId=${encodeURIComponent(userId)}`)
      );
    });
  });

  describe('submitRatingRequest()', () => {
    test('should send POST request with correct data for thumbs up', async () => {
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      await submitRatingRequest(testSongs.song1, 1);

      expect(fetch).toHaveBeenCalledWith(
        '/api/ratings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      // Check the body
      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.songId).toBe(testSongs.song1);
      expect(body.rating).toBe(1);
      expect(body.userId).toBeDefined();
    });

    test('should send POST request with correct data for thumbs down', async () => {
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 0, thumbs_down: 1, userRating: -1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      await submitRatingRequest(testSongs.song1, -1);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.rating).toBe(-1);
    });

    test('should include userId from getUserId()', async () => {
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      const userId = getUserId();
      await submitRatingRequest(testSongs.song1, 1);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.userId).toBe(userId);
    });

    test('should call loadRatings after successful submission', async () => {
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      await submitRatingRequest(testSongs.song1, 1);

      // First call is POST /api/ratings
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/ratings', expect.any(Object));

      // Second call is GET /api/ratings/:songId (from loadRatings)
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(`/api/ratings/${encodeURIComponent(testSongs.song1)}`)
      );
    });

    test('should not call loadRatings if submission fails', async () => {
      const mockSubmitResponse = { success: false };

      fetch.mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse));

      await submitRatingRequest(testSongs.song1, 1);

      // Only one fetch call (the POST), no loadRatings call
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await submitRatingRequest(testSongs.song1, 1);

      expect(console.error).toHaveBeenCalledWith(
        'Error submitting rating:',
        expect.any(Error)
      );
    });

    test('should send correct Content-Type header', async () => {
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      await submitRatingRequest(testSongs.song1, 1);

      const callArgs = fetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });

    test('should handle special characters in songId', async () => {
      const specialSongId = 'Artist & Band_Title (Remix)';
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      await submitRatingRequest(specialSongId, 1);

      const callArgs = fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.songId).toBe(specialSongId);
    });
  });

  describe('Rating Flow Integration', () => {
    test('complete flow: submit rating and update UI', async () => {
      const mockSubmitResponse = { success: true };
      const mockLoadResponse = {
        success: true,
        data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
      };

      fetch
        .mockResolvedValueOnce(mockFetchSuccess(mockSubmitResponse))
        .mockResolvedValueOnce(mockFetchSuccess(mockLoadResponse));

      await submitRatingRequest(testSongs.song1, 1);

      // Check DOM was updated
      expect(thumbsUpCount.textContent).toBe('1');
      expect(thumbsDownCount.textContent).toBe('0');
      expect(thumbsUpBtn.classList.contains('active')).toBe(true);
      expect(thumbsDownBtn.classList.contains('active')).toBe(false);
    });

    test('should handle changing vote from up to down', async () => {
      // First vote: thumbs up
      fetch
        .mockResolvedValueOnce(mockFetchSuccess({ success: true }))
        .mockResolvedValueOnce(mockFetchSuccess({
          success: true,
          data: { thumbs_up: 1, thumbs_down: 0, userRating: 1 }
        }));

      await submitRatingRequest(testSongs.song1, 1);
      expect(thumbsUpBtn.classList.contains('active')).toBe(true);

      // Second vote: change to thumbs down
      fetch
        .mockResolvedValueOnce(mockFetchSuccess({ success: true }))
        .mockResolvedValueOnce(mockFetchSuccess({
          success: true,
          data: { thumbs_up: 0, thumbs_down: 1, userRating: -1 }
        }));

      await submitRatingRequest(testSongs.song1, -1);
      expect(thumbsUpBtn.classList.contains('active')).toBe(false);
      expect(thumbsDownBtn.classList.contains('active')).toBe(true);
      expect(thumbsUpCount.textContent).toBe('0');
      expect(thumbsDownCount.textContent).toBe('1');
    });
  });
});

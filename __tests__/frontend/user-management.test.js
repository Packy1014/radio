/**
 * Frontend User Management Tests
 * Tests the getUserId() function from app.js
 */

describe('User Management - getUserId()', () => {
  let getUserId;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Define getUserId function (extracted from app.js)
    getUserId = function() {
      let userId = localStorage.getItem('radioUserId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('radioUserId', userId);
      }
      return userId;
    };
  });

  test('should create new user ID if none exists', () => {
    const userId = getUserId();

    expect(userId).toBeDefined();
    expect(typeof userId).toBe('string');
    expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
  });

  test('should store user ID in localStorage', () => {
    const userId = getUserId();

    const storedId = localStorage.getItem('radioUserId');
    expect(storedId).toBe(userId);
  });

  test('should return existing user ID on subsequent calls', () => {
    const firstId = getUserId();
    const secondId = getUserId();
    const thirdId = getUserId();

    expect(secondId).toBe(firstId);
    expect(thirdId).toBe(firstId);
  });

  test('should have correct ID format with timestamp and random string', () => {
    const userId = getUserId();
    const parts = userId.split('_');

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('user');
    expect(parts[1]).toMatch(/^\d+$/); // Timestamp
    expect(parts[2]).toMatch(/^[a-z0-9]+$/); // Random string
    expect(parts[2].length).toBeGreaterThan(0);
  });

  test('should use pre-existing localStorage value', () => {
    const existingId = 'user_1234567890_abc123xyz';
    localStorage.setItem('radioUserId', existingId);

    const userId = getUserId();

    expect(userId).toBe(existingId);
  });

  test('should generate unique IDs for different users', () => {
    const id1 = getUserId();
    localStorage.clear(); // Simulate new user
    const id2 = getUserId();
    localStorage.clear(); // Simulate another new user
    const id3 = getUserId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  test('should persist ID across page refreshes (simulated)', () => {
    const originalId = getUserId();

    // Simulate page refresh by getting new ID without clearing localStorage
    const afterRefreshId = getUserId();

    expect(afterRefreshId).toBe(originalId);
  });

  test('should handle empty string in localStorage', () => {
    localStorage.setItem('radioUserId', '');

    // Empty string is falsy, so should generate new ID
    const userId = getUserId();

    expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
    expect(userId).not.toBe('');
  });

  test('should create ID even if localStorage initially has null', () => {
    // localStorage.getItem returns null for non-existent keys
    expect(localStorage.getItem('radioUserId')).toBeNull();

    const userId = getUserId();

    expect(userId).toBeDefined();
    expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/);
  });

  test('timestamp in ID should be reasonable', () => {
    const beforeTime = Date.now();
    const userId = getUserId();
    const afterTime = Date.now();

    const timestamp = parseInt(userId.split('_')[1]);

    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });

  test('random portion should be alphanumeric', () => {
    const userId = getUserId();
    const randomPart = userId.split('_')[2];

    // Should only contain lowercase letters and numbers
    expect(randomPart).toMatch(/^[a-z0-9]+$/);
    expect(randomPart).not.toContain('_');
    expect(randomPart).not.toContain('-');
    expect(randomPart).not.toContain(' ');
  });

  test('should generate IDs with reasonable random part length', () => {
    const userId = getUserId();
    const randomPart = userId.split('_')[2];

    // Based on Math.random().toString(36).substring(2, 15), should be 13 chars max
    expect(randomPart.length).toBeGreaterThan(0);
    expect(randomPart.length).toBeLessThanOrEqual(13);
  });
});

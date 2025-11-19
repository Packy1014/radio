# Radio Streaming Web Application

A modern web-based radio streaming application featuring live audio playback, song ratings, and metadata display. Built with Node.js and vanilla JavaScript.

## Features

- **Live Radio Streaming**: HLS audio streaming using hls.js
- **Song Ratings**: Dual rating system with thumbs up/down and 1-5 star ratings
- **Now Playing**: Real-time display of current track information
- **Recently Played**: View song history
- **User Management**: User accounts and authentication
- **Responsive Design**: Mobile-friendly interface with custom styling
- **Comprehensive Testing**: 136 automated tests covering backend and frontend

## Tech Stack

### Backend
- **Server**: Express.js (v5.1.0)
- **Database**: SQLite with better-sqlite3 driver
- **Runtime**: Node.js
- **Configuration**: dotenv for environment variables

### Frontend
- **Audio Streaming**: hls.js for HLS playback
- **UI Framework**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS with Montserrat and Open Sans fonts
- **Storage**: localStorage for user session management

### Testing
- **Test Framework**: Jest (v29.7.0)
- **API Testing**: Supertest (v6.3.3)
- **DOM Testing**: @testing-library/dom (v9.3.3)
- **Test Environment**: Node.js for backend, jsdom for frontend
- **Coverage**: 136 tests across 6 test suites

## Project Structure

```
radio/
├── server.js              # Express application and API routes
├── database.js            # SQLite database setup and queries
├── package.json           # Dependencies and scripts
├── jest.config.js         # Jest test configuration
├── .env                   # Environment configuration
├── .gitignore            # Git ignore rules
├── RadioCalicoStyle/     # Brand assets and style guide
│   ├── RadioCalico_style_Guide.txt
│   └── RadioCalicoLogoTM.png
├── __tests__/            # Test files (Jest framework)
│   ├── setup/            # Test configuration and helpers
│   │   ├── backend-setup.js      # Backend test environment
│   │   ├── frontend-setup.js     # Frontend test environment
│   │   └── test-helpers.js       # Shared test utilities
│   ├── backend/          # Backend unit and integration tests
│   │   ├── database.test.js      # Database layer tests (35 tests)
│   │   ├── api-ratings.test.js   # Thumbs up/down API tests (17 tests)
│   │   └── api-star-ratings.test.js  # Star rating API tests (22 tests)
│   └── frontend/         # Frontend unit tests
│       ├── user-management.test.js   # User ID management (12 tests)
│       ├── ratings.test.js           # Thumbs up/down UI tests (20 tests)
│       └── star-ratings.test.js      # Star rating UI tests (28 tests)
└── public/               # Static frontend files
    ├── index.html        # HTML structure
    ├── styles.css        # All CSS styling
    ├── app.js            # JavaScript application logic
    └── logo.png          # Radio logo image
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Packy1014/radio.git
cd radio
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

5. Open your browser to http://localhost:3000

### Running Tests

Run the complete test suite:
```bash
npm test                  # Run all 136 tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:backend      # Run only backend tests (68 tests)
npm run test:frontend     # Run only frontend tests (68 tests)
```

## API Endpoints

### Health Check
- `GET /api/test` - Test API connectivity
- `GET /api/db-test` - Test database connection

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com"
  }
  ```

### Posts
- `GET /api/posts` - Get all posts with user information
- `POST /api/posts` - Create a new post
  ```json
  {
    "userId": 1,
    "title": "Post Title",
    "content": "Post content"
  }
  ```

### Song Ratings (Thumbs Up/Down)
- `POST /api/ratings` - Submit or update a thumbs up/down rating
  ```json
  {
    "songId": "Artist_SongTitle",
    "userId": "user_123_abc",
    "rating": 1  // 1 for thumbs up, -1 for thumbs down
  }
  ```
- `GET /api/ratings/:songId?userId=X` - Get rating counts and user's rating for a song
  ```json
  {
    "success": true,
    "data": {
      "thumbs_up": 42,
      "thumbs_down": 7,
      "userRating": 1  // null if user hasn't rated
    }
  }
  ```

### Star Ratings (1-5 Stars)
- `POST /api/star-ratings` - Submit or update a star rating
  ```json
  {
    "songId": "Artist_SongTitle",
    "userId": "user_123_abc",
    "rating": 5  // Integer 1-5
  }
  ```
- `GET /api/star-ratings/:songId?userId=X` - Get average rating and user's rating
  ```json
  {
    "success": true,
    "data": {
      "average_rating": 4.2,
      "total_ratings": 150,
      "userRating": 5  // null if user hasn't rated
    }
  }
  ```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Song Ratings Table (Thumbs Up/Down)
```sql
CREATE TABLE song_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_id, user_id)
);
```

### Star Ratings Table (1-5 Stars)
```sql
CREATE TABLE song_star_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_id, user_id)
);
```

## Configuration

Environment variables in `.env`:

```
PORT=3000                    # Server port
DATABASE_PATH=./data.db      # SQLite database file path
NODE_ENV=development         # Environment mode
```

## Testing

### Overview

This project includes comprehensive automated testing with **136 tests** covering both backend and frontend functionality. The test suite uses **Jest** as the test runner with separate configurations for Node.js (backend) and jsdom (frontend) environments.

### Test Organization

**Backend Tests (68 tests)**
- `database.test.js` (35 tests) - Database layer unit tests
  - Thumbs up/down rating CRUD operations
  - Star rating (1-5) CRUD operations
  - Data validation and constraints
  - Aggregation calculations (averages, counts)
- `api-ratings.test.js` (17 tests) - Thumbs up/down API endpoint tests
  - POST /api/ratings validation and success paths
  - GET /api/ratings/:songId with/without userId
  - Error handling and special characters
- `api-star-ratings.test.js` (22 tests) - Star rating API endpoint tests
  - POST /api/star-ratings with strict type validation
  - GET /api/star-ratings/:songId with average calculations
  - Edge case validation (strings, decimals, out-of-range)

**Frontend Tests (68 tests)**
- `user-management.test.js` (12 tests) - User ID management
  - getUserId() generation and persistence
  - localStorage integration
  - ID format validation
- `ratings.test.js` (20 tests) - Thumbs up/down rating UI
  - loadRatings() and submitRatingRequest()
  - DOM updates and active state management
  - Complete rating flows
- `star-ratings.test.js` (28 tests) - Star rating UI
  - updateStarDisplay(), loadStarRatings(), submitStarRating()
  - Star fill/empty state management
  - Complete rating change workflows

### Test Commands

```bash
npm test                  # Run all 136 tests
npm run test:watch        # Watch mode for TDD workflow
npm run test:coverage     # Generate coverage report
npm run test:backend      # Run only backend tests (68 tests)
npm run test:frontend     # Run only frontend tests (68 tests)
```

### Test Patterns

- **Backend**: Uses in-memory SQLite databases (`:memory:`) for fast, isolated tests
- **Frontend**: Uses jsdom for DOM simulation with mocked fetch and localStorage
- **Isolation**: Each test has independent setup/teardown
- **Coverage**: Input validation, error handling, success paths, and edge cases

### Writing New Tests

When adding features:
1. Write database layer tests first (verify data operations)
2. Add API endpoint tests (verify HTTP layer and validation)
3. Add frontend tests (verify UI behavior and user interactions)
4. Follow existing test patterns in `__tests__/` directory
5. Use `npm run test:watch` for test-driven development

## Development

### Adding New Features

**Database Changes**: Edit `database.js` in the `initDatabase()` function
- Use `CREATE TABLE IF NOT EXISTS` for safety
- Enable foreign keys: `db.pragma('foreign_keys = ON')`
- Use prepared statements for all queries

**API Routes**: Add routes in `server.js`
- Use try/catch for error handling
- Return JSON with `{ success: boolean, ... }` structure
- Validate required fields (return 400 for missing data)
- Validate data types (use `typeof` and `Number.isInteger()` for numeric fields)
- Return 500 for server errors
- Write corresponding tests in `__tests__/backend/`

**Frontend Changes**:
- **HTML**: Edit `public/index.html` for structure
- **CSS**: Edit `public/styles.css` for styling
- **JavaScript**: Edit `public/app.js` for functionality
- Write corresponding tests in `__tests__/frontend/`

### Manual API Testing with cURL

For quick manual testing, you can use cURL commands. However, prefer using the automated test suite (`npm test`) for comprehensive validation.

Create a user:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com"}'
```

Submit a thumbs up rating:
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"songId":"Artist_SongTitle","userId":"user_123_abc","rating":1}'
```

Get thumbs up/down statistics:
```bash
curl http://localhost:3000/api/ratings/Artist_SongTitle?userId=user_123_abc
```

Submit a star rating:
```bash
curl -X POST http://localhost:3000/api/star-ratings \
  -H "Content-Type: application/json" \
  -d '{"songId":"Artist_SongTitle","userId":"user_123_abc","rating":5}'
```

Get star rating statistics:
```bash
curl http://localhost:3000/api/star-ratings/Artist_SongTitle?userId=user_123_abc
```

## Brand Guidelines

This application follows the Radio Calico brand guidelines:
- Style guide: `RadioCalicoStyle/RadioCalico_style_Guide.txt`
- Logo: `RadioCalicoStyle/RadioCalicoLogoTM.png`
- Fonts: Montserrat (headings), Open Sans (body)
- Custom color scheme per brand specifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and write tests
4. Run the test suite (`npm test`) to ensure all tests pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Requirements

- All tests must pass (`npm test`)
- Add tests for new features
- Follow existing code patterns and conventions
- Validate all user inputs at the API layer
- Use prepared statements for all database queries

## License

This project is available under the MIT License.

## Acknowledgments

- HLS streaming powered by [hls.js](https://github.com/video-dev/hls.js/)
- Database powered by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- Web framework: [Express.js](https://expressjs.com/)
- Testing framework: [Jest](https://jestjs.io/)
- API testing: [Supertest](https://github.com/ladjs/supertest)
- DOM testing: [Testing Library](https://testing-library.com/)

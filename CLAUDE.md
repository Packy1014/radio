# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Start the development server:
```bash
npm start
# or
npm run dev
```

The server runs on http://localhost:3000 by default.

Run tests:
```bash
npm test                  # Run all tests (136 tests across 6 suites)
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:backend      # Run only backend tests (68 tests)
npm run test:frontend     # Run only frontend tests (68 tests)
```

## Architecture Overview

This is a radio streaming web application with a Node.js backend and vanilla JavaScript frontend.

### Backend Stack
- **Server**: Express.js (v5.1.0) web server
- **Database**: SQLite with better-sqlite3 driver
- **Environment**: CommonJS modules (not ES modules)
- **Configuration**: dotenv for environment variables

### Style Guide
- A text version of the styling guide for the webpage is at ./RadioCalicoStyle/RadioCalico_style_Guide.txt
- The Radio Calico logo is at ./RadioCalicoStyle/RadioCalicoLogoTM.png

### Project Structure
- `server.js` - Express application entry point with API routes
- `database.js` - SQLite database connection, schema initialization, and data access functions
- `public/` - Static frontend files
  - `index.html` - Main HTML structure
  - `styles.css` - All CSS styling
  - `app.js` - All JavaScript application logic
  - `logo.png` - Radio Calico logo image
- `__tests__/` - Test files (Jest framework)
  - `setup/` - Test configuration and helpers
    - `backend-setup.js` - Backend test environment setup
    - `frontend-setup.js` - Frontend test environment setup (mocks fetch, localStorage)
    - `test-helpers.js` - Shared test utilities and fixtures
  - `backend/` - Backend unit and integration tests
    - `database.test.js` - Database layer tests (35 tests)
    - `api-ratings.test.js` - Thumbs up/down API tests (17 tests)
    - `api-star-ratings.test.js` - Star rating API tests (22 tests)
  - `frontend/` - Frontend unit tests
    - `user-management.test.js` - User ID management tests (12 tests)
    - `ratings.test.js` - Thumbs up/down rating tests (20 tests)
    - `star-ratings.test.js` - Star rating UI tests (28 tests)
- `jest.config.js` - Jest test framework configuration
- `data.db` - SQLite database file (auto-created on first run)
- `.env` - Environment configuration (PORT, DATABASE_PATH, NODE_ENV)

### Database Architecture

The database uses better-sqlite3 (synchronous API) with four main tables:

1. **users** - User accounts with username/email
2. **posts** - User-generated posts with foreign key to users
3. **song_ratings** - Song ratings (thumbs up/down) with unique constraint on (song_id, user_id)
4. **song_star_ratings** - Star ratings (1-5) with unique constraint on (song_id, user_id)

Key patterns:
- Foreign keys are enabled via `db.pragma('foreign_keys = ON')`
- Database initialization happens automatically on require via `initDatabase()`
- All database functions are exported from `database.js` and imported into route handlers
- Use prepared statements for all queries (already implemented)
- Tests use in-memory SQLite databases (`:memory:`) for isolation and speed

### API Endpoints

Health checks:
- `GET /api/test` - API connectivity test
- `GET /api/db-test` - Database connection test

Users:
- `GET /api/users` - List all users
- `POST /api/users` - Create user (requires username, email)

Posts:
- `GET /api/posts` - List all posts with user info (JOIN query)
- `POST /api/posts` - Create post (requires userId, title, optional content)

Ratings:
- `POST /api/ratings` - Submit/update song rating (requires songId, userId, rating as 1 or -1)
- `GET /api/ratings/:songId?userId=X` - Get rating counts and optional user's rating

Star Ratings:
- `POST /api/star-ratings` - Submit/update star rating (requires songId, userId, rating as integer 1-5)
- `GET /api/star-ratings/:songId?userId=X` - Get average rating, total count, and optional user's rating

### Frontend Application

The main application is a radio player with separated concerns:

**`public/index.html`** - HTML structure only
- Semantic HTML markup
- References external CSS and JavaScript files

**`public/styles.css`** - All styling
- Custom UI using Montserrat and Open Sans fonts
- Responsive design with mobile breakpoints
- Color scheme following Radio Calico brand guidelines

**`public/app.js`** - All application logic
- HLS streaming integration for Radio Calico using hls.js
- Song rating system (thumbs up/down) that integrates with `/api/ratings`
- Star rating system (1-5 stars) that integrates with `/api/star-ratings`
- Metadata fetching and display (now playing, recently played)
- Audio player controls (play/pause, volume, time display)
- Vanilla JavaScript (no framework)
- User ID management via localStorage

## Key Implementation Notes

### Adding Database Tables
Edit `database.js` in the `initDatabase()` function. The function runs on every server start but uses `CREATE TABLE IF NOT EXISTS` for safety.

### Adding API Routes
Add routes in `server.js`. All routes should:
- Use try/catch for error handling
- Return JSON with `{ success: boolean, ... }` structure
- Validate required fields and return 400 for missing data
- Validate data types (use `typeof` and `Number.isInteger()` for numeric fields)
- Return 500 for server errors
- Add corresponding tests in `__tests__/backend/`

### Modifying Frontend Files
The frontend follows a clean separation of concerns:
- **HTML changes**: Edit `public/index.html` for structural changes only
- **Style changes**: Edit `public/styles.css` for all visual styling
- **JavaScript changes**: Edit `public/app.js` for all application logic and behavior

### Static Files
Files in `public/` are served directly via `express.static('public')`. The root route `/` serves `public/index.html`, which links to `styles.css` and `app.js`.

## Testing Framework

### Overview
The project uses **Jest** as the test runner with separate configurations for backend (Node.js) and frontend (jsdom) environments. All 136 tests pass successfully.

### Test Organization
- **Backend tests** (68 tests): Use in-memory SQLite databases for isolation
- **Frontend tests** (68 tests): Use jsdom for DOM simulation with mocked fetch and localStorage

### Running Tests
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:backend      # Backend tests only
npm run test:frontend     # Frontend tests only
```

### Test Coverage

**Backend Tests (68 total)**:
- `database.test.js` (35 tests)
  - submitRating(), getRatings(), getUserRating()
  - submitStarRating(), getStarRatings(), getUserStarRating()
  - Database constraints, validation, edge cases
- `api-ratings.test.js` (17 tests)
  - POST /api/ratings validation and success paths
  - GET /api/ratings/:songId with/without userId
  - Error handling (400, 500), special characters
- `api-star-ratings.test.js` (22 tests)
  - POST /api/star-ratings with strict type validation
  - GET /api/star-ratings/:songId with average calculations
  - Edge cases (strings, decimals, out-of-range values)

**Frontend Tests (68 total)**:
- `user-management.test.js` (12 tests)
  - getUserId() generation and persistence
  - localStorage integration
  - ID format validation
- `ratings.test.js` (20 tests)
  - loadRatings() and submitRatingRequest()
  - DOM updates and active state management
  - Complete rating flows
- `star-ratings.test.js` (28 tests)
  - updateStarDisplay(), loadStarRatings(), submitStarRating()
  - Star fill/empty state management
  - Complete rating change workflows

### Test Patterns and Best Practices
- Each test suite has isolated setup/teardown
- Backend tests use fresh in-memory databases per test
- Frontend tests mock fetch() and localStorage
- All tests verify input validation, error handling, and happy paths
- Mock data is centralized in `__tests__/setup/test-helpers.js`

### Writing New Tests
When adding features:
1. Add database tests first (verify data layer)
2. Add API endpoint tests (verify HTTP layer)
3. Add frontend tests (verify UI behavior)
4. Use existing test patterns as templates
5. Run `npm run test:watch` during development

## Environment Variables

Configure in `.env`:
- `PORT` - Server port (default: 3000)
- `DATABASE_PATH` - SQLite database file path (default: ./data.db)
- `NODE_ENV` - Environment mode (development/production)

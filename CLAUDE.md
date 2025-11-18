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
- `data.db` - SQLite database file (auto-created on first run)
- `.env` - Environment configuration (PORT, DATABASE_PATH, NODE_ENV)

### Database Architecture

The database uses better-sqlite3 (synchronous API) with three main tables:

1. **users** - User accounts with username/email
2. **posts** - User-generated posts with foreign key to users
3. **song_ratings** - Song ratings (thumbs up/down) with unique constraint on (song_id, user_id)

Key patterns:
- Foreign keys are enabled via `db.pragma('foreign_keys = ON')`
- Database initialization happens automatically on require via `initDatabase()`
- All database functions are exported from `database.js` and imported into route handlers
- Use prepared statements for all queries (already implemented)

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
- Return 500 for server errors

### Modifying Frontend Files
The frontend follows a clean separation of concerns:
- **HTML changes**: Edit `public/index.html` for structural changes only
- **Style changes**: Edit `public/styles.css` for all visual styling
- **JavaScript changes**: Edit `public/app.js` for all application logic and behavior

### Static Files
Files in `public/` are served directly via `express.static('public')`. The root route `/` serves `public/index.html`, which links to `styles.css` and `app.js`.

## Environment Variables

Configure in `.env`:
- `PORT` - Server port (default: 3000)
- `DATABASE_PATH` - SQLite database file path (default: ./data.db)
- `NODE_ENV` - Environment mode (development/production)

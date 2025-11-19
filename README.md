# Radio Streaming Web Application

A modern web-based radio streaming application featuring live audio playback, song ratings, and metadata display. Built with Node.js and vanilla JavaScript, fully containerized with Docker for easy deployment.

## Features

- **Live Radio Streaming**: HLS audio streaming using hls.js
- **Song Ratings**: Dual rating system with thumbs up/down and 1-5 star ratings
- **Now Playing**: Real-time display of current track information
- **Recently Played**: View song history
- **User Management**: User accounts and authentication
- **Responsive Design**: Mobile-friendly interface with custom styling
- **Comprehensive Testing**: 136 automated tests covering backend and frontend
- **Docker Deployment**: Self-contained deployment with development and production configurations
- **Dual Database Support**: SQLite for development/testing, PostgreSQL for production
- **Production-Ready**: nginx web server with gzip compression and API proxying

## Tech Stack

### Backend
- **Server**: Express.js (v5.1.0) with async/await handlers
- **Database**:
  - **Development/Testing**: SQLite with better-sqlite3 driver
  - **Production**: PostgreSQL 16 with pg (node-postgres) driver
  - Unified async API abstraction layer
- **Runtime**: Node.js 20
- **Configuration**: dotenv for environment variables
- **Dependencies**: express, pg, better-sqlite3, dotenv

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

### Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for dev and production
- **Development**: Single container (Node.js + SQLite)
- **Production**: Multi-container architecture:
  - nginx 1.25-alpine for frontend (~10MB)
  - Node.js 20 Alpine backend (~150MB)
  - PostgreSQL 16 Alpine database
- **Security**: Non-root user, resource limits, health checks, read-only mounts
- **Features**: gzip compression, static file caching, API proxying

## Project Structure

```
radio/
├── server.js              # Express application and async API routes
├── database.js            # Database abstraction (SQLite/PostgreSQL)
├── Makefile               # Build automation (make dev, make prod, make test)
├── nginx.conf             # nginx configuration for production
├── package.json           # Dependencies and scripts
├── jest.config.js         # Jest test configuration
├── Dockerfile             # Multi-stage Docker build (dev/prod/test)
├── docker-compose.yml     # Development Docker configuration (SQLite)
├── docker-compose.prod.yml  # Production Docker config (PostgreSQL + nginx)
├── .dockerignore          # Docker build exclusions
├── .env.example           # Environment variable template
├── .env                   # Environment configuration (not in git)
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

### Quick Start with Makefile

The easiest way to get started is using the provided Makefile:

```bash
# Clone the repository
git clone https://github.com/Packy1014/radio.git
cd radio

# View all available commands
make help

# Start development environment (with live reload)
make dev

# OR start production environment (nginx + PostgreSQL)
make prod

# Run all tests
make test

# Check service health
make health
```

See the full list of commands by running `make help`.

### Prerequisites

**Option 1: Using Makefile (Recommended)**
- Docker (v20.10+)
- Docker Compose (v2.0+)
- make (usually pre-installed on macOS/Linux)

**Option 2: Native Node.js**
- Node.js (v14 or higher recommended)
- npm or yarn

**Option 3: Docker (Manual)**
- Docker (v20.10+)
- Docker Compose (v2.0+)

### Installation

**Native Node.js Setup:**

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

**Docker Setup:**

1. Clone the repository:
```bash
git clone https://github.com/Packy1014/radio.git
cd radio
```

2. Start with Docker Compose:
```bash
# Development (with live reload)
npm run docker:dev

# OR Production (optimized, detached)
npm run docker:prod
```

3. Open your browser to http://localhost:3000

See the [Docker Deployment](#docker-deployment-1) section below for detailed documentation, configuration options, and troubleshooting.

### Running Tests

**Native Node.js:**
```bash
npm test                  # Run all 136 tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:backend      # Run only backend tests (68 tests)
npm run test:frontend     # Run only frontend tests (68 tests)
```

**Docker:**
```bash
npm run docker:test       # Run all tests in isolated container
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

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file from the template:

```bash
cp .env.example .env
```

### Configuration Options

**Server Settings:**
- `PORT` - HTTP server port (default: 3000)
- `NODE_ENV` - Environment mode: `development`, `production`, or `test`

**Database Settings:**
- `DATABASE_TYPE` - Database backend: `sqlite` (default) or `postgres`

**SQLite Configuration (Development/Testing):**
```bash
DATABASE_TYPE=sqlite
DATABASE_PATH=./data.db
```

**PostgreSQL Configuration (Production):**
```bash
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost        # Use 'postgres' in Docker Compose
POSTGRES_PORT=5432
POSTGRES_DB=radio
POSTGRES_USER=radio
POSTGRES_PASSWORD=your_secure_password
```

### Usage Examples

**Development with SQLite:**
```bash
# .env
PORT=3000
NODE_ENV=development
DATABASE_TYPE=sqlite
DATABASE_PATH=./data.db
```

**Production with PostgreSQL:**
```bash
# .env
PORT=3000
NODE_ENV=production
DATABASE_TYPE=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=radio
POSTGRES_USER=radio
POSTGRES_PASSWORD=strong_password_here
```

**Docker Compose:**
Docker Compose automatically reads the `.env` file and applies variables to all services. For production, ensure you set a strong `POSTGRES_PASSWORD`.

## Docker Deployment

### Overview

The application is fully containerized with different architectures for development and production:

**Development:**
- Single Node.js container
- SQLite database with file persistence
- Live code reloading via volume mounts
- Direct API and static file serving

**Production:**
- Multi-container architecture:
  - **nginx**: Frontend web server (static files, gzip, caching)
  - **radio-backend**: Node.js API server
  - **postgres**: PostgreSQL 16 database
- Service networking with health checks
- Volume persistence for PostgreSQL data
- Resource limits and security hardening

### Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

### Quick Start

**Option 1: Development Container (with live reload)**
```bash
npm run docker:dev
```
This starts the application in development mode with:
- Live code reloading via volume mounts
- Full access to development tools
- Database persisted in `radio-data-dev` volume
- Access at http://localhost:3000

**Option 2: Production Containers**
```bash
npm run docker:prod
```
This starts a multi-container production environment with:
- **nginx** web server serving static files on port 80 (exposed as 3000)
- **Node.js backend** API server with async handlers
- **PostgreSQL 16** database with persistent storage
- nginx gzip compression and static file caching
- API request proxying from nginx to backend
- Service health checks and auto-restart
- Resource limits per service
- Non-root user for backend security
- PostgreSQL data persisted in `postgres-data` volume
- Runs in detached mode

### Docker Commands Reference

```bash
# Development
npm run docker:dev              # Start development container
npm run docker:dev:down         # Stop development container

# Production
npm run docker:prod             # Start production container (detached)
npm run docker:prod:down        # Stop production container
npm run docker:prod:logs        # View production logs (follow mode)

# Testing
npm run docker:test             # Run tests in container

# Cleanup
npm run docker:clean            # Remove all containers and volumes
```

### Manual Docker Commands

If you prefer direct Docker commands:

**Development:**
```bash
docker-compose up --build
docker-compose down
docker-compose logs -f
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f
```

**Build specific stages:**
```bash
# Build production image
docker build --target production -t radio-app:latest .

# Build and run tests
docker build --target test -t radio-test .
docker run --rm radio-test
```

### Architecture

The Dockerfile uses **multi-stage builds** with the following stages:

1. **base** - Common package.json layer
2. **dependencies** - Full dependency installation
3. **development** - Development environment with dev dependencies
4. **prod-dependencies** - Production-only dependencies
5. **production** - Optimized production image
6. **test** - Isolated testing environment

**Benefits:**
- Smaller production images (~200MB Alpine-based)
- Faster builds through layer caching
- Separate dev/prod dependencies
- Dedicated test environment

### Volume Persistence

Databases are persisted using Docker volumes:

**Development (SQLite):**
- Volume: `radio-data-dev`
- Mount: `/app/data`
- Database file: `data.db`

**Production (PostgreSQL):**
- Volume: `postgres-data`
- Mount: `/var/lib/postgresql/data`
- Database: PostgreSQL cluster data

**Manage volumes:**
```bash
# List volumes
docker volume ls

# Inspect volumes
docker volume inspect radio-data-dev     # Development (SQLite)
docker volume inspect postgres-data      # Production (PostgreSQL)

# Remove volume (⚠️ data loss!)
docker volume rm radio-data-dev
docker volume rm postgres-data
```

**Backup databases:**

SQLite (Development):
```bash
# Backup
docker run --rm \
  -v radio-data-dev:/data \
  -v $(pwd):/backup \
  alpine cp /data/data.db /backup/backup-dev-$(date +%Y%m%d).db

# Restore
docker run --rm \
  -v radio-data-dev:/data \
  -v $(pwd):/backup \
  alpine cp /backup/backup-dev-20231201.db /data/data.db
```

PostgreSQL (Production):
```bash
# Backup using pg_dump
docker exec radio-postgres pg_dump -U radio radio > backup-prod-$(date +%Y%m%d).sql

# Restore from backup
docker exec -i radio-postgres psql -U radio radio < backup-prod-20231201.sql
```

### Health Checks

All production containers include health checks:

**nginx:**
- Endpoint: `GET /health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3

**radio-backend:**
- Endpoint: `GET /api/test`
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3
- Start period: 40 seconds (waits for PostgreSQL)

**postgres:**
- Command: `pg_isready`
- Interval: 10 seconds
- Timeout: 5 seconds
- Retries: 5

Check container health:
```bash
docker ps                           # View all container health status
docker inspect radio-nginx          # nginx health info
docker inspect radio-backend-prod   # Backend health info
docker inspect radio-postgres       # PostgreSQL health info
```

### Production Features

The production deployment includes:

**Architecture:**
- Multi-container setup (nginx + backend + PostgreSQL)
- Service networking with health checks
- nginx reverse proxy for API requests
- Static file serving with caching

**nginx Container:**
- gzip compression enabled
- Static file caching (1 year for assets)
- API proxying to backend
- Resource limits: 0.5 CPU, 128MB RAM

**Backend Container:**
- Non-root user (`nodejs`, UID 1001)
- Read-only application code
- Minimal Alpine Linux base
- Resource limits: 1.0 CPU, 512MB RAM

**PostgreSQL Container:**
- PostgreSQL 16 Alpine
- Persistent volume storage
- Resource limits: 1.0 CPU, 512MB RAM
- Health monitoring via pg_isready

**Logging:**
- JSON file driver (nginx only, others use Docker default)
- Max log size: 10MB
- Max log files: 3 (rotation)

**Reliability:**
- Automatic restart on failure (all services)
- Health checks for all containers
- Service dependencies (backend waits for PostgreSQL)

### Development Features

The development container includes:

**Live Reload:**
- Source code mounted as volumes
- Changes reflected immediately
- No rebuild required

**Full Tool Access:**
- All devDependencies installed
- Testing tools available
- Debugging capabilities

### Deployment Scenarios

**Single Server:**
```bash
# SSH into server
ssh user@server

# Clone repository
git clone https://github.com/Packy1014/radio.git
cd radio

# Start production container
npm run docker:prod

# Container runs in background with auto-restart
```

**With Reverse Proxy (Nginx):**
```bash
# docker-compose.prod.yml with custom port
PORT=3001 npm run docker:prod

# Nginx config
# proxy_pass http://localhost:3001;
```

**Docker Swarm:**
```bash
docker stack deploy -c docker-compose.prod.yml radio-stack
```

**Kubernetes:**
Convert docker-compose to Kubernetes manifests using Kompose:
```bash
kompose convert -f docker-compose.prod.yml
kubectl apply -f .
```

### Troubleshooting

**Container won't start:**
```bash
# Check logs
docker-compose logs radio-dev
docker logs radio-streaming-prod

# Check container details
docker inspect radio-streaming-prod
```

**Port already in use:**
```bash
# Change port in docker-compose.yml or via environment
PORT=3001 npm run docker:prod

# Or stop conflicting service
sudo lsof -i :3000
kill <PID>
```

**Database permission issues:**
```bash
# Remove volume and restart
npm run docker:clean
npm run docker:prod
```

**Out of disk space:**
```bash
# Clean up Docker resources
docker system prune -a
docker volume prune
```

**Cannot connect to database:**
```bash
# Verify volume exists
docker volume inspect radio-data-prod

# Check file permissions inside container
docker exec radio-streaming-prod ls -la /app/data
```

**Memory issues:**
```bash
# Increase memory limit in docker-compose.prod.yml
# Change: memory: 1G
npm run docker:prod:down
npm run docker:prod
```

### Performance Optimization

**Build Performance:**
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker build .

# Parallel builds
docker-compose build --parallel
```

**Runtime Performance:**
```bash
# Monitor resource usage
docker stats radio-streaming-prod

# Check logs for performance issues
npm run docker:prod:logs | grep -i "slow\|error"
```

### CI/CD Integration

Run tests in CI pipeline:
```yaml
# GitHub Actions example
- name: Run Docker tests
  run: npm run docker:test
```

Build and push to registry:
```bash
# Build production image
docker build --target production -t username/radio-app:latest .

# Push to Docker Hub
docker push username/radio-app:latest

# Deploy on server
docker pull username/radio-app:latest
docker run -d -p 3000:3000 username/radio-app:latest
```

## Makefile Commands

The project includes a comprehensive Makefile that simplifies common development, testing, and deployment tasks.

### View All Commands

```bash
make help
```

This displays all available targets with descriptions.

### Common Commands

**Development:**
```bash
make dev                  # Start development environment
make stop                 # Stop development environment
make restart              # Restart development environment
make logs                 # View development logs
make shell                # Open shell in container
```

**Production:**
```bash
make prod                 # Start production (nginx + backend + PostgreSQL)
make prod-down            # Stop production
make prod-logs            # View all production logs
make prod-logs-nginx      # View nginx logs only
make prod-logs-backend    # View backend logs only
make prod-logs-postgres   # View PostgreSQL logs only
make prod-status          # Show container status
make health               # Check service health
```

**Testing:**
```bash
make test                 # Run all 136 tests
make test-watch           # Run tests in watch mode
make test-coverage        # Run tests with coverage report
make test-backend         # Run only backend tests
make test-frontend        # Run only frontend tests
make test-docker          # Run tests in Docker container
```

**Database Management:**
```bash
make db-shell-dev         # Connect to SQLite (development)
make db-shell-prod        # Connect to PostgreSQL (production)
make backup-dev           # Backup development database
make backup-prod          # Backup production database
make restore-dev FILE=... # Restore development database
make restore-prod FILE=...# Restore production database
```

**Cleanup:**
```bash
make clean                # Remove containers (keeps data)
make clean-volumes        # Remove all volumes (⚠️ data loss!)
make clean-all            # Remove everything
make clean-images         # Remove Docker images
make prune                # Remove unused Docker resources
```

**Build & Deploy:**
```bash
make build-prod           # Build production images
make build-dev            # Build development image
make build-test           # Build test image
make deploy               # Deploy to production
```

**Utilities:**
```bash
make ps                   # Show running containers
make volumes              # List Docker volumes
make images               # List Docker images
make status               # Show container status
make version              # Show tool versions
```

### Example Workflows

**Start fresh development environment:**
```bash
make clean
make dev
```

**Run tests before deploying:**
```bash
make test
make test-coverage
make prod
```

**Backup production database:**
```bash
make backup-prod
# Creates backups/backup-prod-YYYYMMDD-HHMMSS.sql
```

**View production service health:**
```bash
make prod-status
make health
```

**Complete cleanup and fresh start:**
```bash
make clean-all
make install
make prod
```

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

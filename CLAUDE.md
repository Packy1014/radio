# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start with Make

The project includes a comprehensive Makefile for easy workflow management:

```bash
make help                 # Show all available commands

# Development
make dev                  # Start development environment
make stop                 # Stop development environment
make logs                 # View development logs
make test                 # Run all tests

# Production
make prod                 # Start production (nginx + backend + PostgreSQL)
make prod-down            # Stop production
make prod-logs            # View all production logs
make health               # Check service health

# Testing
make test                 # Run all 136 tests
make test-watch           # Run tests in watch mode
make test-coverage        # Run tests with coverage

# Security
make security-audit       # Run npm audit to check for vulnerabilities
make security-audit-fix   # Automatically fix security vulnerabilities
make security-check       # Run comprehensive security check

# Database
make backup-dev           # Backup development SQLite database
make backup-prod          # Backup production PostgreSQL database
make db-shell-prod        # Connect to PostgreSQL shell

# Cleanup
make clean                # Remove containers (keeps data)
make clean-all            # Remove everything (⚠️  data loss!)
```

### Native Node.js Commands

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

### Docker Commands (npm scripts)

```bash
# Development (with live reload)
npm run docker:dev        # Start development container
npm run docker:dev:down   # Stop development container

# Production
npm run docker:prod       # Start production container (detached)
npm run docker:prod:down  # Stop production container
npm run docker:prod:logs  # View production logs

# Testing
npm run docker:test       # Run tests in container

# Cleanup
npm run docker:clean      # Remove all containers and volumes
```

## Architecture Overview

This is a radio streaming web application with a Node.js backend and vanilla JavaScript frontend, fully containerized with Docker for self-contained deployment.

### Backend Stack
- **Server**: Express.js (v5.1.0) web server with async/await route handlers
- **Database**:
  - **Development/Testing**: SQLite with better-sqlite3 driver
  - **Production**: PostgreSQL 16 with pg (node-postgres) driver
  - Unified async API abstraction supporting both databases
- **Environment**: CommonJS modules (not ES modules)
- **Configuration**: dotenv for environment variables
- **Dependencies**: express (v5.1.0), pg (v8.13.1), better-sqlite3 (v12.4.1)

### Deployment Stack
- **Containerization**: Docker with multi-stage builds
- **Development**:
  - Docker Compose with SQLite and volume mounts for live reload
  - Single Node.js container serving both API and static files
- **Production**:
  - **Frontend**: nginx (1.25-alpine) serving static files with gzip compression
  - **Backend**: Node.js API server (~150MB Alpine-based image)
  - **Database**: PostgreSQL 16 (Alpine) with persistent volume storage
  - Multi-container architecture with service networking
- **Security**: Non-root user, resource limits, health checks, read-only mounts
- **Orchestration**: Docker Compose for both dev and production environments

### Style Guide
- A text version of the styling guide for the webpage is at ./RadioCalicoStyle/RadioCalico_style_Guide.txt
- The Radio Calico logo is at ./RadioCalicoStyle/RadioCalicoLogoTM.png

### Project Structure
- `server.js` - Express application entry point with async API routes
- `database.js` - Database abstraction layer supporting both SQLite and PostgreSQL
- `Makefile` - Build automation with targets for dev, prod, test, and utilities
- `nginx.conf` - nginx configuration for production frontend (static files, API proxy, compression)
- `Dockerfile` - Multi-stage Docker build (base, dependencies, development, production, test)
- `docker-compose.yml` - Development Docker Compose configuration (SQLite, single container)
- `docker-compose.prod.yml` - Production Docker Compose configuration (PostgreSQL, nginx, backend)
- `.dockerignore` - Docker build context exclusions
- `.env.example` - Environment variable template
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

The application supports **dual database backends** with a unified async API:
- **SQLite** (development/testing) - File-based with better-sqlite3 driver
- **PostgreSQL** (production) - Server-based with pg (node-postgres) driver

The database type is determined by the `DATABASE_TYPE` environment variable.

**Schema** (four main tables):
1. **users** - User accounts with username/email
2. **posts** - User-generated posts with foreign key to users
3. **song_ratings** - Song ratings (thumbs up/down) with unique constraint on (song_id, user_id)
4. **song_star_ratings** - Star ratings (1-5) with unique constraint on (song_id, user_id)

**Key patterns:**
- All database functions use async/await for consistency across both databases
- `database.js` provides abstraction layer that handles SQL syntax differences:
  - Parameter placeholders: `?` → `$1, $2, ...` conversion for PostgreSQL
  - AUTO_INCREMENT (SQLite) → SERIAL (PostgreSQL)
  - ON CONFLICT syntax handling
- Foreign keys are enabled (SQLite: `pragma`, PostgreSQL: native support)
- Database initialization happens automatically via `initDatabase()` async function
- All queries use prepared statements for SQL injection prevention
- **Testing**: Uses in-memory SQLite (`:memory:`) for isolation and speed
- **Development**: SQLite with file persistence in `radio-data-dev` Docker volume
- **Production**: PostgreSQL with data in `postgres-data` Docker volume

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
- Use `async` function handlers with `await` for database calls
- Use try/catch for error handling
- Return JSON with `{ success: boolean, ... }` structure
- Validate required fields and return 400 for missing data
- Validate data types (use `typeof` and `Number.isInteger()` for numeric fields)
- Return 500 for server errors
- Add corresponding tests in `__tests__/backend/`

Example pattern:
```javascript
app.post('/api/endpoint', async (req, res) => {
  try {
    const { field } = req.body;
    if (!field) {
      return res.status(400).json({ success: false, error: 'Field required' });
    }
    const result = await databaseFunction(field);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Modifying Frontend Files
The frontend follows a clean separation of concerns:
- **HTML changes**: Edit `public/index.html` for structural changes only
- **Style changes**: Edit `public/styles.css` for all visual styling
- **JavaScript changes**: Edit `public/app.js` for all application logic and behavior
- Write corresponding tests in `__tests__/frontend/`

### Docker Development Workflow
When developing with Docker:
- **Development mode**: Use `npm run docker:dev` for live reload via volume mounts
- **Code changes**: Automatically reflected without rebuild (server.js, database.js, public/)
- **Dependency changes**: Require rebuild with `docker-compose up --build`
- **Testing in Docker**: Use `npm run docker:test` to run tests in isolated container
- **Database persistence**: Data persists in `radio-data-dev` volume across container restarts
- **Production testing**: Use `npm run docker:prod` to test production build locally

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

## Security

### Security Scanning

The project includes integrated security scanning using npm audit to detect vulnerabilities in dependencies.

### Running Security Scans

**Quick security check:**
```bash
make security-audit          # Run npm audit to check for vulnerabilities
make security-check          # Alias for security-audit
```

**Fix vulnerabilities automatically:**
```bash
make security-audit-fix      # Run npm audit fix to auto-fix issues
```

**Production-only scan:**
```bash
make security-audit-production  # Only scan production dependencies
```

**Detailed report:**
```bash
make security-audit-full     # Generate full JSON report (saved to security-report.json)
```

### Security Best Practices

1. **Regular Scans**: Run `make security-audit` regularly, especially before deployments
2. **Dependency Updates**: Keep dependencies up to date with `npm update` and `npm audit fix`
3. **Review Fixes**: Always review what `npm audit fix` changes before committing
4. **Production Focus**: Use `make security-audit-production` to focus on production dependencies
5. **CI/CD Integration**: Consider adding security scanning to your CI/CD pipeline

### Security Report

The `make security-audit-full` command generates a `security-report.json` file with detailed vulnerability information. This file is automatically ignored by git (listed in `.gitignore`).

**Report contents:**
- Vulnerability severity levels (low, moderate, high, critical)
- Affected packages and versions
- Recommended fixes and patches
- Dependency paths showing how vulnerabilities are introduced

### Interpreting Results

**Severity levels:**
- **Critical**: Immediate action required, can lead to severe security issues
- **High**: Should be fixed soon, potential for significant impact
- **Moderate**: Fix when possible, limited impact or specific conditions required
- **Low**: Minor issues, fix during regular maintenance

**Exit codes:**
- The security audit targets use non-failing exit codes to allow integration in workflows
- Review the output to determine if action is needed

## GitHub Actions CI/CD

### Overview

The project includes automated CI/CD workflows using GitHub Actions for continuous integration, testing, and security monitoring.

### Workflows

**1. CI - Tests & Security (`.github/workflows/ci.yml`)**

Runs on every push and pull request to `main` and `develop` branches, plus daily scheduled runs.

**Jobs:**
- **test**: Runs all 136 unit tests across multiple Node.js versions (18.x, 20.x, 22.x)
- **security**: Performs npm audit security scans with artifact uploads
- **docker-test**: Runs tests in Docker containers
- **lint**: Code quality checks including dependency verification
- **summary**: Aggregates all job results

**Features:**
- Multi-version Node.js testing (18, 20, 22)
- Test coverage reports uploaded to Codecov
- Fails on critical vulnerabilities
- Warns on high severity vulnerabilities
- Daily security scans at 2 AM UTC

**2. Security Scan (`.github/workflows/security.yml`)**

Dedicated security scanning workflow with enhanced monitoring and alerting.

**Jobs:**
- **dependency-audit**: Full npm audit with detailed reporting
- **dependency-review**: Reviews dependency changes in pull requests
- **outdated-check**: Identifies outdated packages (scheduled runs only)

**Features:**
- Daily scheduled scans at 3 AM UTC
- Manual trigger via workflow_dispatch
- Automatic issue creation for critical vulnerabilities
- Separate production dependency scanning
- 90-day artifact retention for audit reports
- Detailed vulnerability summaries in GitHub Actions summary

**Triggers:**
- Schedule: Daily at 3 AM UTC
- Manual: Via GitHub Actions UI
- Push: When package.json or package-lock.json changes on main branch
- Pull requests: Dependency review on all PRs

**3. Claude Code (`.github/workflows/claude.yml`)**

Interactive Claude Code assistant triggered by @claude mentions in issues and pull requests.

### Workflow Artifacts

**Security Reports:**
- `security-report.json` - Full npm audit JSON output
- `audit-summary.txt` - Human-readable audit summary
- `audit-prod.json` - Production-only audit results
- `outdated-report.txt` - Outdated dependencies report

**Access artifacts:**
1. Go to GitHub Actions tab
2. Select the workflow run
3. Scroll to "Artifacts" section
4. Download desired report

### Required Secrets

Configure these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

- `CLAUDE_CODE_OAUTH_TOKEN` - Required for Claude Code workflows
- `CODECOV_TOKEN` - Optional, for uploading test coverage to Codecov

### CI/CD Best Practices

1. **Before Pushing:**
   - Run `make test` locally to ensure tests pass
   - Run `make security-audit` to check for vulnerabilities
   - Fix any critical or high severity issues

2. **Pull Requests:**
   - All tests must pass before merging
   - Review security scan results
   - Address dependency review warnings

3. **Monitoring:**
   - Check GitHub Actions tab regularly
   - Review security scan issues when created
   - Update dependencies based on outdated reports

4. **Security Issues:**
   - Critical vulnerabilities will fail the CI pipeline
   - Automated issues will be created for critical findings
   - Use `npm audit fix` to resolve compatible issues
   - Test thoroughly after applying security fixes

### Manual Workflow Triggers

**Run security scan manually:**
1. Go to Actions tab in GitHub
2. Select "Security Scan" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

**View workflow status badges:**
- CI status: `[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)`
- Security status: `[![Security](https://github.com/USER/REPO/actions/workflows/security.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/security.yml)`

### Troubleshooting CI Failures

**Test failures:**
```bash
# Run tests locally
npm test

# Run specific test suite
npm run test:backend
npm run test:frontend

# Run with verbose output
npm test -- --verbose
```

**Security failures:**
```bash
# Check for vulnerabilities
npm audit

# Try automatic fixes
npm audit fix

# Check what will be fixed
npm audit fix --dry-run

# Force major version updates (use with caution)
npm audit fix --force
```

**Docker test failures:**
```bash
# Build and run test container locally
docker build --target test -t radio-test .
docker run --rm radio-test
```

## Environment Variables

Configure in `.env`:

**Server Configuration:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production/test)

**Database Configuration:**
- `DATABASE_TYPE` - Database type: `sqlite` (default) or `postgres`

**SQLite (Development/Testing):**
- `DATABASE_PATH` - SQLite database file path (default: ./data.db)

**PostgreSQL (Production):**
- `POSTGRES_HOST` - PostgreSQL host (default: localhost, Docker: postgres)
- `POSTGRES_PORT` - PostgreSQL port (default: 5432)
- `POSTGRES_DB` - Database name (default: radio)
- `POSTGRES_USER` - Database user (default: radio)
- `POSTGRES_PASSWORD` - Database password (default: radio, change in production!)

## Docker Deployment

### Overview

The application is fully containerized with Docker support for both development and production environments. The Docker setup uses multi-stage builds for optimized image sizes and includes health checks for reliability.

### Quick Start

**Development (with live reload):**
```bash
npm run docker:dev
# Access at http://localhost:3000
```

**Production:**
```bash
npm run docker:prod
# Access at http://localhost:3000
```

### Docker Architecture

**Multi-stage Build:**
- `base` - Common dependencies layer
- `dependencies` - Full dependency installation
- `development` - Dev environment with all dependencies and volume mounts
- `prod-dependencies` - Production-only dependencies
- `production` - Optimized production image with non-root user
- `test` - Isolated testing environment

**Key Features:**
- Health checks on `/api/test` endpoint
- Volume persistence for SQLite database
- Non-root user for production security
- Resource limits (1 CPU, 512MB RAM in production)
- Log rotation (10MB max, 3 files)
- Live reload in development via volume mounts

### Docker Files

- `Dockerfile` - Multi-stage Dockerfile with dev/prod/test targets
- `docker-compose.yml` - Development configuration with volume mounts
- `docker-compose.prod.yml` - Production configuration with resource limits
- `.dockerignore` - Excludes unnecessary files from build context

### Development Workflow

1. **Start development container:**
   ```bash
   npm run docker:dev
   ```
   - Mounts source code for live reload
   - Database persisted in `radio-data-dev` volume
   - Access at http://localhost:3000

2. **View logs:**
   ```bash
   docker-compose logs -f radio-dev
   ```

3. **Stop container:**
   ```bash
   npm run docker:dev:down
   ```

### Production Deployment

Production uses a **multi-container architecture**:
- **nginx** - Frontend web server (port 80, exposed as 3000)
- **radio-backend** - Node.js API server
- **postgres** - PostgreSQL 16 database

**Architecture:**
```
[Client] → [nginx:80] → [radio-backend:3000] → [postgres:5432]
             ↓
         Static Files
```

1. **Build and start:**
   ```bash
   npm run docker:prod
   ```
   - Starts all three services in detached mode
   - nginx serves static files and proxies `/api/*` to backend
   - Backend uses PostgreSQL for data persistence
   - PostgreSQL data persisted in `postgres-data` volume
   - Automatic restart on failure
   - Health checks for all services

2. **View logs:**
   ```bash
   npm run docker:prod:logs          # All services
   docker logs radio-nginx           # nginx only
   docker logs radio-backend-prod    # Backend only
   docker logs radio-postgres        # PostgreSQL only
   ```

3. **Access application:**
   - **Frontend**: http://localhost:3000 (served by nginx)
   - **API**: http://localhost:3000/api/test (proxied to backend)
   - **Health**: http://localhost:3000/health (nginx health check)

4. **Stop containers:**
   ```bash
   npm run docker:prod:down
   ```

**Production Features:**
- nginx with gzip compression and static file caching
- PostgreSQL for robust data persistence
- Service health monitoring
- Resource limits (CPU/memory)
- Non-root user for backend security
- Read-only file mounts where applicable

### Direct Docker Commands

**Development:**
```bash
docker-compose up --build                    # Start dev container
docker-compose down                          # Stop dev container
docker-compose logs -f                       # View logs
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d    # Start prod
docker-compose -f docker-compose.prod.yml down            # Stop prod
docker-compose -f docker-compose.prod.yml logs -f         # View logs
```

**Testing:**
```bash
docker build --target test -t radio-test .   # Build test image
docker run --rm radio-test                   # Run tests
```

**Cleanup:**
```bash
npm run docker:clean                         # Remove all containers and volumes
docker system prune -a                       # Clean all Docker resources
```

### Volume Management

**Development volume (SQLite):**
```bash
docker volume ls                             # List volumes
docker volume inspect radio-data-dev         # Inspect dev volume
docker volume rm radio-data-dev              # Remove dev volume (data loss!)
```

**Production volume (PostgreSQL):**
```bash
docker volume inspect postgres-data          # Inspect prod volume
docker volume rm postgres-data               # Remove prod volume (data loss!)
```

**Backup databases:**

SQLite (development):
```bash
docker run --rm -v radio-data-dev:/data -v $(pwd):/backup alpine \
  cp /data/data.db /backup/backup-dev-$(date +%Y%m%d).db
```

PostgreSQL (production):
```bash
# Using pg_dump
docker exec radio-postgres pg_dump -U radio radio > backup-prod-$(date +%Y%m%d).sql

# Restore from backup
docker exec -i radio-postgres psql -U radio radio < backup-prod-$(date).sql
```

### Environment Configuration

Create `.env` file from template:
```bash
cp .env.example .env
# Edit .env as needed
```

Docker Compose will automatically load `.env` file for environment variables.

### Health Checks

Both development and production containers include health checks:
- **Endpoint**: `GET /api/test`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3
- **Start period**: 5s (dev) / 10s (prod)

Check container health:
```bash
docker ps                                    # View health status
docker inspect radio-streaming-prod          # Detailed health info
```

### Security Notes

**Production container:**
- Runs as non-root user (`nodejs:nodejs`, UID 1001)
- Read-only source code
- Minimal attack surface (Alpine Linux base)
- Resource limits prevent DoS

**Development container:**
- Root access for development flexibility
- Volume mounts for live reload
- Not suitable for production use

### Troubleshooting

**Container won't start:**
```bash
docker-compose logs radio-dev               # Check logs
docker inspect radio-streaming-dev          # Check container details
```

**Database permission issues:**
```bash
# Ensure volume has correct permissions
docker-compose down
docker volume rm radio-data-dev
docker-compose up --build
```

**Port already in use:**
```bash
# Change port in docker-compose.yml or .env
PORT=3001 npm run docker:prod
```

**Clean slate:**
```bash
npm run docker:clean                        # Remove containers and volumes
docker system prune -a                      # Remove all Docker resources
```

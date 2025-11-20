# GitHub Actions CI/CD Documentation

This document provides details about the GitHub Actions workflows configured for this project.

## Workflows Overview

### 1. CI - Tests & Security (`ci.yml`)

**Purpose:** Continuous integration with comprehensive testing and security scanning

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Daily schedule at 2:00 AM UTC

**Jobs:**

#### Test Job
- Runs on: Ubuntu Latest
- Node.js versions: 18.x, 20.x, 22.x (matrix strategy)
- Steps:
  1. Checkout repository
  2. Setup Node.js with npm caching
  3. Install dependencies with `npm ci`
  4. Run all 136 unit tests
  5. Generate coverage report (Node 20.x only)
  6. Upload coverage to Codecov (optional)

#### Security Job
- Runs on: Ubuntu Latest
- Node.js version: 20.x
- Steps:
  1. Checkout repository
  2. Setup Node.js
  3. Install dependencies
  4. Run npm audit (moderate level)
  5. Run npm audit for production only (high level)
  6. Generate JSON security report
  7. Upload security report as artifact
  8. Check for critical/high vulnerabilities
  9. Fail if critical vulnerabilities found
  10. Warn if high vulnerabilities found

#### Docker Test Job
- Runs on: Ubuntu Latest
- Steps:
  1. Checkout repository
  2. Setup Docker Buildx
  3. Build test Docker image
  4. Run tests in Docker container

#### Lint Job
- Runs on: Ubuntu Latest
- Node.js version: 20.x
- Steps:
  1. Checkout repository
  2. Setup Node.js
  3. Install dependencies
  4. Check for missing dependencies
  5. Verify package-lock.json signatures

#### Summary Job
- Runs after all jobs complete
- Aggregates results from all jobs
- Fails if tests or Docker tests fail
- Warns if security or lint checks fail

**Artifacts:**
- `security-report` (30-day retention)

**Exit Conditions:**
- ✅ Pass: All tests pass, no critical vulnerabilities
- ⚠️  Warning: High vulnerabilities or lint issues
- ❌ Fail: Test failures or critical vulnerabilities

---

### 2. Security Scan (`security.yml`)

**Purpose:** Dedicated security scanning with enhanced monitoring and alerting

**Triggers:**
- Daily schedule at 3:00 AM UTC
- Manual trigger via `workflow_dispatch`
- Push to `main` branch when `package.json` or `package-lock.json` changes
- Pull requests (dependency-review job only)

**Jobs:**

#### Dependency Audit Job
- Runs on: Ubuntu Latest
- Node.js version: 20.x
- Steps:
  1. Checkout repository
  2. Setup Node.js
  3. Install dependencies
  4. Run full npm audit
  5. Run production-only npm audit
  6. Parse vulnerability counts
  7. Create GitHub Actions summary table
  8. Upload audit reports (90-day retention)
  9. Fail on critical vulnerabilities
  10. Warn on high vulnerabilities
  11. Create GitHub issue for critical findings

**Issue Creation:**
- Automatically creates issues for critical vulnerabilities
- Updates existing security issue if one is open
- Labels: `security`, `automated`, `critical`
- Includes full audit summary and fix recommendations

#### Dependency Review Job
- Runs on: Pull Requests only
- Uses GitHub's dependency-review-action
- Fails on high severity vulnerabilities
- Posts summary comment in PR

#### Outdated Check Job
- Runs on: Schedule and manual triggers only
- Checks for outdated dependencies
- Uploads outdated report (30-day retention)

**Artifacts:**
- `security-audit-reports` (90-day retention):
  - `audit-full.json`
  - `audit-summary.txt`
  - `audit-prod.json`
  - `audit-prod-summary.txt`
- `outdated-dependencies-report` (30-day retention):
  - `outdated-report.txt`

**Exit Conditions:**
- ✅ Pass: No critical vulnerabilities
- ⚠️  Warning: High vulnerabilities found
- ❌ Fail: Critical vulnerabilities found

---

### 3. Claude Code (`claude.yml`)

**Purpose:** Interactive Claude Code assistant for issues and PRs

**Triggers:**
- Issue comments containing `@claude`
- Pull request review comments containing `@claude`
- Pull request reviews containing `@claude`
- Issues opened/assigned with `@claude` in title or body

**Permissions:**
- `contents: read`
- `pull-requests: read`
- `issues: read`
- `id-token: write`
- `actions: read` (for reading CI results)

**Required Secret:** `CLAUDE_CODE_OAUTH_TOKEN`

---

### 4. Claude Code Review (`claude-code-review.yml`)

**Purpose:** Automated code review using Claude Code

**Triggers:**
- Pull requests opened
- Pull requests synchronized (new commits)

**Permissions:**
- `contents: read`
- `pull-requests: read`
- `issues: read`
- `id-token: write`

**Review Areas:**
- Code quality and best practices
- Potential bugs or issues
- Performance considerations
- Security concerns
- Test coverage

**Required Secret:** `CLAUDE_CODE_OAUTH_TOKEN`

---

## Setup Instructions

### 1. Configure Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions**

Add the following secrets:

- **CLAUDE_CODE_OAUTH_TOKEN** (Required)
  - Obtain from Claude Code settings
  - Required for claude.yml and claude-code-review.yml

- **CODECOV_TOKEN** (Optional)
  - Obtain from codecov.io
  - Enables test coverage uploads in ci.yml

### 2. Enable GitHub Actions

1. Go to repository Settings
2. Navigate to Actions → General
3. Select "Allow all actions and reusable workflows"
4. Save changes

### 3. Configure Branch Protection

Recommended settings for `main` branch:

1. Go to Settings → Branches
2. Add rule for `main`
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status checks:
     - `test`
     - `security`
     - `docker-test`
     - `lint`

### 4. Enable Dependency Alerts

1. Go to Settings → Code security and analysis
2. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates

---

## Monitoring and Maintenance

### Viewing Workflow Runs

1. Go to the **Actions** tab
2. Select a workflow from the left sidebar
3. Click on a specific run to view details
4. View job logs, artifacts, and summaries

### Downloading Artifacts

1. Navigate to a completed workflow run
2. Scroll to the **Artifacts** section at the bottom
3. Click the artifact name to download

### Manual Workflow Execution

**Run Security Scan manually:**
1. Go to Actions tab
2. Select "Security Scan" from the left sidebar
3. Click "Run workflow" button
4. Select branch
5. Click "Run workflow"

### Interpreting Results

**Test Results:**
- Green checkmark: All tests passed
- Red X: Tests failed - check logs for details
- Yellow warning: Tests passed but with warnings

**Security Results:**
- View detailed reports in artifacts
- Check GitHub Actions summary for vulnerability counts
- Review created issues for critical findings

**Coverage Reports:**
- View on Codecov.io (if configured)
- Check coverage trends over time

---

## Troubleshooting

### Workflow Not Running

**Check:**
1. GitHub Actions are enabled in repository settings
2. Workflow file syntax is valid (YAML)
3. Triggers are correctly configured
4. Branch name matches trigger conditions

### Failed Security Scans

**Common causes:**
1. New vulnerabilities in dependencies
2. Outdated packages
3. Transitive dependency issues

**Solutions:**
```bash
# Check locally
npm audit

# Fix automatically
npm audit fix

# Update specific package
npm update package-name

# Check production only
npm audit --production
```

### Failed Tests

**Debug locally:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific suite
npm run test:backend
npm run test:frontend

# Run in watch mode
npm run test:watch

# Run in Docker
make test-docker
```

### Secret Not Found

**Error:** "Secret CLAUDE_CODE_OAUTH_TOKEN not found"

**Fix:**
1. Verify secret is created in repository settings
2. Check secret name matches exactly (case-sensitive)
3. Ensure secret has repository access (for organization repos)

---

## Customization

### Modify Test Matrix

Edit `ci.yml` to change Node.js versions:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add or remove versions
```

### Change Schedule

Edit cron expressions in workflow files:

```yaml
schedule:
  - cron: '0 3 * * *'  # Daily at 3:00 AM UTC
  # Format: minute hour day month day-of-week
```

### Adjust Security Thresholds

Edit security job audit levels:

```yaml
# Fail on moderate or higher
npm audit --audit-level=moderate

# Fail on high or critical only
npm audit --audit-level=high
```

---

## Best Practices

1. **Run tests locally before pushing**
   ```bash
   make test
   make security-audit
   ```

2. **Review workflow results regularly**
   - Check Actions tab weekly
   - Address security issues promptly
   - Monitor test coverage trends

3. **Keep dependencies updated**
   - Review outdated dependency reports
   - Update packages regularly
   - Test after updates

4. **Monitor artifact storage**
   - Artifacts count toward storage limits
   - Adjust retention periods if needed
   - Download important reports

5. **Use branch protection**
   - Require status checks
   - Require reviews before merge
   - Keep main branch stable

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Codecov Documentation](https://docs.codecov.com/)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)

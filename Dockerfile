# Multi-stage Dockerfile for Radio Streaming Application
# Supports both development and production builds

# =============================================================================
# Base Stage - Common dependencies
# =============================================================================
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# =============================================================================
# Dependencies Stage - Install all dependencies
# =============================================================================
FROM base AS dependencies

# Install all dependencies (including devDependencies for testing)
RUN npm ci

# =============================================================================
# Development Stage
# =============================================================================
FROM base AS development

# Set NODE_ENV to development
ENV NODE_ENV=development

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/test', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start development server with live reload capability
CMD ["npm", "run", "dev"]

# =============================================================================
# Production Dependencies Stage - Install only production dependencies
# =============================================================================
FROM base AS prod-dependencies

# Install only production dependencies
RUN npm ci --only=production

# =============================================================================
# Production Stage
# =============================================================================
FROM node:20-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=prod-dependencies /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/test', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start production server
CMD ["npm", "start"]

# =============================================================================
# Test Stage - For running tests in CI/CD
# =============================================================================
FROM base AS test

ENV NODE_ENV=test

# Copy all dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Run tests
CMD ["npm", "test"]

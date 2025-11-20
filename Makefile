.PHONY: help install dev dev-up dev-down dev-logs prod prod-up prod-down prod-logs prod-status test test-watch test-coverage test-backend test-frontend test-docker security-audit security-audit-fix security-audit-production security-audit-full security-check clean clean-containers clean-volumes clean-all backup-dev backup-prod restore-dev restore-prod db-shell-dev db-shell-prod health

# Default target - show help
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Date format for backups
DATE := $(shell date +%Y%m%d-%H%M%S)

##@ Help

help: ## Display this help message
	@echo "$(BLUE)Radio Streaming Application - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

install: ## Install Node.js dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

env: ## Create .env file from template
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✓ Created .env file from template$(NC)"; \
		echo "$(YELLOW)⚠ Please review and update .env with your settings$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .env file already exists$(NC)"; \
	fi

##@ Development

dev: dev-up ## Start development environment (alias for dev-up)

dev-up: ## Start development Docker container with live reload
	@echo "$(YELLOW)Starting development environment...$(NC)"
	docker-compose up --build
	@echo "$(GREEN)✓ Development environment started$(NC)"

dev-down: ## Stop development Docker container
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Development environment stopped$(NC)"

dev-logs: ## View development container logs
	docker-compose logs -f

dev-shell: ## Open shell in development container
	docker-compose exec radio-dev sh

dev-restart: dev-down dev-up ## Restart development environment

##@ Production

prod: prod-up ## Start production environment (alias for prod-up)

prod-up: ## Start production Docker containers (nginx + backend + PostgreSQL)
	@echo "$(YELLOW)Starting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml up --build -d
	@echo "$(GREEN)✓ Production environment started$(NC)"
	@echo "$(BLUE)Access at: http://localhost:3000$(NC)"
	@make prod-status

prod-down: ## Stop production Docker containers
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✓ Production environment stopped$(NC)"

prod-logs: ## View production container logs (all services)
	docker-compose -f docker-compose.prod.yml logs -f

prod-logs-nginx: ## View nginx logs only
	docker logs -f radio-nginx

prod-logs-backend: ## View backend logs only
	docker logs -f radio-backend-prod

prod-logs-postgres: ## View PostgreSQL logs only
	docker logs -f radio-postgres

prod-status: ## Show status of production containers
	@echo "$(BLUE)Production Container Status:$(NC)"
	@docker-compose -f docker-compose.prod.yml ps

prod-restart: prod-down prod-up ## Restart production environment

prod-shell-backend: ## Open shell in production backend container
	docker exec -it radio-backend-prod sh

prod-shell-nginx: ## Open shell in nginx container
	docker exec -it radio-nginx sh

##@ Testing

test: ## Run all tests (136 tests)
	@echo "$(YELLOW)Running all tests...$(NC)"
	npm test
	@echo "$(GREEN)✓ All tests passed$(NC)"

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "$(YELLOW)Running tests with coverage...$(NC)"
	npm run test:coverage

test-backend: ## Run only backend tests (68 tests)
	@echo "$(YELLOW)Running backend tests...$(NC)"
	npm run test:backend

test-frontend: ## Run only frontend tests (68 tests)
	@echo "$(YELLOW)Running frontend tests...$(NC)"
	npm run test:frontend

test-docker: ## Run tests in Docker container
	@echo "$(YELLOW)Running tests in Docker...$(NC)"
	npm run docker:test
	@echo "$(GREEN)✓ Docker tests passed$(NC)"

##@ Security

security-audit: ## Run npm audit to check for vulnerabilities
	@echo "$(YELLOW)Running security audit...$(NC)"
	@npm audit || (echo "$(RED)✗ Vulnerabilities found$(NC)" && exit 0)
	@echo "$(GREEN)✓ Security audit complete$(NC)"

security-audit-fix: ## Automatically fix security vulnerabilities
	@echo "$(YELLOW)Fixing security vulnerabilities...$(NC)"
	npm audit fix
	@echo "$(GREEN)✓ Security fixes applied$(NC)"

security-audit-production: ## Run audit for production dependencies only
	@echo "$(YELLOW)Running production security audit...$(NC)"
	@npm audit --production || (echo "$(RED)✗ Vulnerabilities found$(NC)" && exit 0)
	@echo "$(GREEN)✓ Production security audit complete$(NC)"

security-audit-full: ## Run detailed security audit with full report
	@echo "$(YELLOW)Running detailed security audit...$(NC)"
	@npm audit --json > security-report.json 2>/dev/null || true
	@npm audit
	@echo ""
	@echo "$(BLUE)Full report saved to: security-report.json$(NC)"

security-check: security-audit ## Run comprehensive security check (alias)

##@ Database

db-shell-dev: ## Connect to development SQLite database
	@echo "$(BLUE)Opening SQLite shell (development)...$(NC)"
	@if [ -f ./data.db ]; then \
		sqlite3 ./data.db; \
	else \
		echo "$(RED)✗ Database file not found: ./data.db$(NC)"; \
	fi

db-shell-prod: ## Connect to production PostgreSQL database
	@echo "$(BLUE)Opening PostgreSQL shell (production)...$(NC)"
	docker exec -it radio-postgres psql -U radio -d radio

backup-dev: ## Backup development SQLite database
	@echo "$(YELLOW)Backing up development database...$(NC)"
	@mkdir -p backups
	@if [ -f ./data.db ]; then \
		cp ./data.db backups/backup-dev-$(DATE).db; \
		echo "$(GREEN)✓ Backup created: backups/backup-dev-$(DATE).db$(NC)"; \
	else \
		echo "$(RED)✗ Database file not found: ./data.db$(NC)"; \
	fi

backup-prod: ## Backup production PostgreSQL database
	@echo "$(YELLOW)Backing up production database...$(NC)"
	@mkdir -p backups
	docker exec radio-postgres pg_dump -U radio radio > backups/backup-prod-$(DATE).sql
	@echo "$(GREEN)✓ Backup created: backups/backup-prod-$(DATE).sql$(NC)"

restore-dev: ## Restore development database (usage: make restore-dev FILE=backup-dev-20231201.db)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)✗ Please specify FILE=<backup-file>$(NC)"; \
		echo "$(YELLOW)Example: make restore-dev FILE=backups/backup-dev-20231201.db$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "$(RED)✗ Backup file not found: $(FILE)$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restoring development database from $(FILE)...$(NC)"
	cp $(FILE) ./data.db
	@echo "$(GREEN)✓ Database restored$(NC)"

restore-prod: ## Restore production database (usage: make restore-prod FILE=backup-prod-20231201.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)✗ Please specify FILE=<backup-file>$(NC)"; \
		echo "$(YELLOW)Example: make restore-prod FILE=backups/backup-prod-20231201.sql$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "$(RED)✗ Backup file not found: $(FILE)$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restoring production database from $(FILE)...$(NC)"
	docker exec -i radio-postgres psql -U radio radio < $(FILE)
	@echo "$(GREEN)✓ Database restored$(NC)"

##@ Health & Status

health: ## Check health of all production services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "$(YELLOW)nginx:$(NC)"
	@curl -sf http://localhost:3000/health > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend API:$(NC)"
	@curl -sf http://localhost:3000/api/test > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@curl -sf http://localhost:3000/api/db-test > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"

status: prod-status ## Show status of all containers (alias for prod-status)

##@ Cleanup

clean: clean-containers ## Remove containers (keeps volumes)

clean-containers: ## Stop and remove all containers
	@echo "$(YELLOW)Removing all containers...$(NC)"
	docker-compose down
	docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✓ Containers removed$(NC)"

clean-volumes: ## Remove all Docker volumes (⚠️  DATA LOSS!)
	@echo "$(RED)⚠️  WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker volume rm radio-data-dev radio_postgres-data 2>/dev/null || true; \
		echo "$(GREEN)✓ Volumes removed$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

clean-all: clean-containers clean-volumes ## Remove everything (containers + volumes)

clean-images: ## Remove Docker images
	@echo "$(YELLOW)Removing Docker images...$(NC)"
	docker rmi radio-radio-backend 2>/dev/null || true
	docker rmi radio-test 2>/dev/null || true
	@echo "$(GREEN)✓ Images removed$(NC)"

clean-node: ## Remove node_modules and package-lock.json
	@echo "$(YELLOW)Removing node_modules...$(NC)"
	rm -rf node_modules package-lock.json
	@echo "$(GREEN)✓ Node modules removed$(NC)"

##@ Development Shortcuts

start: dev-up ## Quick start development (alias for dev-up)

stop: dev-down ## Quick stop development (alias for dev-down)

restart: dev-restart ## Quick restart development (alias for dev-restart)

logs: dev-logs ## Quick view logs (alias for dev-logs)

##@ Build & Deploy

build-prod: ## Build production Docker images
	@echo "$(YELLOW)Building production images...$(NC)"
	docker-compose -f docker-compose.prod.yml build
	@echo "$(GREEN)✓ Production images built$(NC)"

build-dev: ## Build development Docker image
	@echo "$(YELLOW)Building development image...$(NC)"
	docker-compose build
	@echo "$(GREEN)✓ Development image built$(NC)"

build-test: ## Build test Docker image
	@echo "$(YELLOW)Building test image...$(NC)"
	docker build --target test -t radio-test .
	@echo "$(GREEN)✓ Test image built$(NC)"

deploy: prod-up ## Deploy to production (alias for prod-up)

##@ Utilities

ps: ## Show all running containers
	@docker ps --filter "name=radio" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

volumes: ## List all Docker volumes
	@docker volume ls --filter "name=radio" -q

images: ## List all Docker images
	@docker images --filter "reference=radio*"

prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

shell: dev-shell ## Open shell in development container (alias for dev-shell)

version: ## Show versions of tools and dependencies
	@echo "$(BLUE)Tool Versions:$(NC)"
	@echo "Node: $$(node --version 2>/dev/null || echo 'not installed')"
	@echo "npm: $$(npm --version 2>/dev/null || echo 'not installed')"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'not installed')"
	@echo "Docker Compose: $$(docker-compose --version 2>/dev/null || echo 'not installed')"
	@echo ""
	@if [ -f package.json ]; then \
		echo "$(BLUE)Application Version:$(NC)"; \
		node -p "require('./package.json').version"; \
	fi

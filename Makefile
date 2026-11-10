.DEFAULT_GOAL := help
.PHONY: help install dev build start lint test audit check clean

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-10s %s\n", $$1, $$2}'

install: ## Install dependencies from the lockfile
	npm ci

dev: ## Run the local dev server (http://localhost:3000)
	npm run dev

build: ## Production build
	npm run build

start: build ## Serve the production build
	npm run start

lint: ## ESLint (also bans "use server")
	npm run lint

test: ## Unit tests
	npm test

audit: ## Audit production dependencies (V15.1.1)
	npm audit --omit=dev

check: lint test build audit ## Everything CI should run

clean: ## Remove build output and coverage
	rm -rf .next out coverage

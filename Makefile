.DEFAULT_GOAL := help
.PHONY: help install dev build start lint test guards audit check up down migrate clean

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

guards: ## CI guards: no Server Actions, no published DB port
	node scripts/ci-guards.mjs

audit: ## Audit production dependencies (V15.1.1)
	npm audit --omit=dev

check: lint test guards build audit ## Everything CI should run

up: ## Start the stack (secrets via dotenvx; Caddy serves https://localhost)
	npx dotenvx run -- docker compose up --build -d

down: ## Stop the stack (keeps the database volume)
	docker compose down

migrate: ## Apply database migrations with the owner role (one-off job)
	npx dotenvx run -- docker compose --profile ops run --build --rm migrate

clean: ## Remove build output and coverage
	rm -rf .next out coverage

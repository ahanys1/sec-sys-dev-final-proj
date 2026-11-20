.DEFAULT_GOAL := help
.PHONY: help install dev build start lint test test-db check-image guards audit check env-local ca-bundle up down reset logs migrate clean

ENV_FILE ?= .env

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

check-image: ## Build the Docker images and assert the runtime image is hardened (needs Docker)
	scripts/check-image.sh

guards: ## CI guards: no Server Actions, no published DB port
	node scripts/ci-guards.mjs

audit: ## Audit production dependencies (V15.1.1)
	npm audit --omit=dev

check: lint test guards build audit ## Everything CI should run

test-db: ## Database tests against a throwaway Postgres in Docker
	scripts/test-db.sh

env-local: ## Create .env.local with random passwords (git-ignored)
	@test ! -f .env.local || { echo ".env.local already exists"; exit 0; }; \
	awk '/change-me/ { c = "openssl rand -hex 24"; c | getline r; close(c); sub(/change-me/, r) } { print }' .env.example > .env.local && echo "Created .env.local"

ca-bundle: env-local ## Trust your network's TLS inspection for image builds (macOS/Linux/WSL2)
	@case "$$(uname -s)" in \
	  Darwin) security find-certificate -a -p /Library/Keychains/System.keychain /System/Library/Keychains/SystemRootCertificates.keychain > ca-bundle.pem ;; \
	  Linux) for f in /etc/ssl/certs/ca-certificates.crt /etc/pki/tls/certs/ca-bundle.crt; do [ -f "$$f" ] && cp "$$f" ca-bundle.pem && break; done ;; \
	  *) echo "Unsupported OS: use WSL2, or set EXTRA_CA_CERT to a PEM file yourself"; exit 1 ;; \
	esac; \
	[ -s ca-bundle.pem ] || { echo "Could not export certificates; set EXTRA_CA_CERT to a PEM file yourself"; exit 1; }; \
	grep -q '^EXTRA_CA_CERT=' .env.local || echo 'EXTRA_CA_CERT=./ca-bundle.pem' >> .env.local; \
	echo "Wrote ca-bundle.pem and set EXTRA_CA_CERT in .env.local"

up: ## Start the full stack at https://localhost (ENV_FILE=.env.local for a local env)
	npx dotenvx run -f $(ENV_FILE) -- docker compose up --build -d

down: ## Stop the stack (keeps the database volume)
	npx dotenvx run -f $(ENV_FILE) -- docker compose down

reset: ## Stop the stack and DELETE the database volume
	npx dotenvx run -f $(ENV_FILE) -- docker compose down -v

logs: ## Follow the stack logs
	npx dotenvx run -f $(ENV_FILE) -- docker compose logs -f

migrate: ## Apply database migrations with the owner role (one-off job)
	npx dotenvx run -f $(ENV_FILE) -- docker compose --profile ops run --build --rm migrate

clean: ## Remove build output and coverage
	rm -rf .next out coverage

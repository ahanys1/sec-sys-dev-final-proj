# Secure Incident Reporting (Team #13)

CS 5343 final project: a secure incident-reporting web app (Next.js, TypeScript, PostgreSQL, Caddy).
Spec: [ASSIGNMENT.md](ASSIGNMENT.md) · Design: [docs/design.md](docs/design.md) · Rules for contributors and AI agents: [AGENTS.md](AGENTS.md)

> **Every AI-assisted change must add an entry to [AI-USAGE-REPORT.md](AI-USAGE-REPORT.md) in the same commit.**

Status: foundation only. `/` is still the scaffold page. Login and incident features land in follow-up PRs.

## Prerequisites

| Need | For | Check |
|---|---|---|
| Node 24 (see `.nvmrc`; `nvm use`) | everything | `node -v` |
| Docker (Docker Desktop or Rancher Desktop) | full stack, DB tests | `docker ps` |
| `openssl`, `make` | helper targets | `make -v` |
| Ports 80 and 443 free | full stack | |

## 1. App only (fastest)

```
make install   # npm ci
make dev       # http://localhost:3000, hot reload
```

No database needed yet.

## 2. Full stack (HTTPS + PostgreSQL)

Runs Caddy (HTTPS) → Next.js app → PostgreSQL in Docker. Only Caddy is reachable from your machine; the database has no host port.

```
make env-local                       # once: creates .env.local with random passwords (git-ignored)
make up      ENV_FILE=.env.local     # build and start
make migrate ENV_FILE=.env.local     # first time, and after any schema change
```

Open **https://localhost**. Your browser will warn about the certificate: it is Caddy's local CA, so continue past it.
To remove the warning (optional, macOS):

```
docker cp "$(docker ps -qf name=caddy)":/data/caddy/pki/authorities/local/root.crt caddy-root.crt
security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db caddy-root.crt
```

Day to day:

| Do this | Command (add `ENV_FILE=.env.local`) |
|---|---|
| Watch logs | `make logs` |
| Stop (keeps data) | `make down` |
| Wipe the database and start clean | `make reset`, then `make up` and `make migrate` |

Passwords are baked into the database on its **first start**. If you regenerate `.env.local`, run `make reset`.

**Team secrets:** the shared `.env` is dotenvx-encrypted (SR-14) and not created yet. Once it exists, put `.env.keys` from the team password manager in the repo root and drop `ENV_FILE=...`. Never commit `.env.keys` or a plaintext `.env`.

## Everyday commands

| Command | What it does |
|---|---|
| `make check` | Everything CI runs: lint, tests, guards, build, `npm audit` |
| `make test` | Unit tests |
| `make test-db` | Database tests against a throwaway Postgres (starts and removes its own container) |
| `make lint` | ESLint, including the banned-function rules ([docs/sdl.md](docs/sdl.md#banned-functions-practice-9)) |
| `make help` | All targets |

## Changing the database

1. Edit `prisma/schema.prisma`.
2. Add a migration folder under `prisma/migrations/` and grant `app_user` only what it needs (see `0002_…`). The audit log stays append-only.
3. Run `make test-db`, then `make migrate` on your stack.

## Contributing

- Work on a feature branch and open a PR. Never push to `main`.
- Read [AGENTS.md](AGENTS.md) before writing security-relevant code, and cite requirement IDs (FR, NFR, SR) in commits.
- New routes or pages go in the entry point inventory in [docs/threat-model.md](docs/threat-model.md) §1.4.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `required variable ... is missing a value` | Add `ENV_FILE=.env.local` to the command, and run `make env-local` once |
| Port 80 or 443 already in use | Stop the other service (or a previous stack: `make down`) |
| Database password rejected after editing `.env.local` | `make reset` (passwords are set on first start) |
| Docker build fails at `binaries.prisma.sh` with a certificate error | Your network inspects TLS. Add its CA to Docker, or build on another network |

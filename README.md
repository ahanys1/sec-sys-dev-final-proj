# Secure Incident Reporting (Team #13)

CS 5343 final project: a secure incident-reporting web app (Next.js, TypeScript, PostgreSQL, Caddy).
Spec: [ASSIGNMENT.md](ASSIGNMENT.md) · Design: [docs/design.md](docs/design.md) · Rules for contributors and AI agents: [AGENTS.md](AGENTS.md)

> **Every AI-assisted change must add an entry to [AI-USAGE-REPORT.md](AI-USAGE-REPORT.md) in the same commit.**

Status: authentication, account management, incidents/comments, categories, audit history, and settings are implemented. The live deployment runbook and recorded checks are in [docs/deployment.md](docs/deployment.md); final release verification remains in progress.

Start with the [user manual](docs/user-manual.md) for setup and account workflows. See [documented source and packaging](docs/source-packaging.md) for the component map and release checklist.

## Prerequisites

| Need | For | Check |
|---|---|---|
| Node 24 (see `.nvmrc`; `nvm use`) | everything | `node -v` |
| Docker (Docker Desktop or Rancher Desktop) | full stack, DB tests | `docker ps` |
| `openssl`, `make` | helper targets | `make -v` |
| Windows: use WSL2 | the Makefile needs a Unix shell | |
| Ports 80 and 443 free | full stack | |

## 1. App only (fastest)

```
make install   # npm ci
make dev       # http://localhost:3000, hot reload
```

This starts only the development server. Database-backed sign-in requires configuration and PostgreSQL; use the HTTPS stack below for complete account workflows.

## 2. Full stack (HTTPS + PostgreSQL)

Runs Caddy (HTTPS) → Next.js app → PostgreSQL in Docker. Only Caddy is reachable from your machine; the database has no host port.

```
make install                         # Node 24; npm ci
umask 077
make env-local                       # once: creates .env.local with random passwords (git-ignored)
chmod 600 .env.local
make up      ENV_FILE=.env.local     # build and start
make migrate ENV_FILE=.env.local     # first time, and after any schema change
make create-admin ENV_FILE=.env.local # once: prompts for the first administrator's username and password
```

Open **https://localhost** after following the [local CA trust steps](docs/user-manual.md#trust-the-local-https-certificate), then sign in with the administrator you created. Trust only the certificate copied from your own stack; do not bypass certificate validation.

Day to day:

| Do this | Command (add `ENV_FILE=.env.local`) |
|---|---|
| Watch logs | `make logs` |
| Stop (keeps data) | `make down` |
| Wipe the database and start clean | `make reset`, then `make up` and `make migrate` |

Passwords are set in the database on its **first start**. Editing `.env.local` does not rotate them. Preserve the original configuration or coordinate credential rotation. `make reset` destroys the database and Caddy CA volumes; use it only for deliberately disposable data, never as routine password recovery.

**Team secrets:** the committed `.env` is the **live deployment's** config, dotenvx-encrypted (SR-14); see [docs/deployment.md](docs/deployment.md). Keep using `ENV_FILE=.env.local` for local work: a plain `make up` defaults to `.env`, which needs the private key and points Caddy at the live hostname, so it fails locally. Never commit `.env.keys` or a plaintext `.env`.

## Everyday commands

| Command | What it does |
|---|---|
| `make check` | Everything CI runs: lint, tests, guards, build, `npm audit` |
| `make test` | Unit tests |
| `make test-db` | Database tests against a throwaway Postgres (starts and removes its own container) |
| `make check-image` | Builds the Docker images and checks the runtime image is non-root with no env files or source maps (add `EXTRA_CA_CERT=./ca-bundle.pem` on a TLS-inspecting network) |
| `make lint` | ESLint, including the banned-function rules ([docs/sdl.md](docs/sdl.md#banned-functions-practice-9)) |
| `make help` | All targets |
| `make package-source` | Export committed source and checksum; see the packaging guide for release checks |

## Changing the database

1. Edit `prisma/schema.prisma`.
2. Add a migration folder under `prisma/migrations/` and grant `app_user` only what it needs (see `0002_…`). The audit log stays append-only.
3. Run `make test-db`, then `make migrate` on your stack.

## Contributing

- Found a vulnerability? Report it privately: see [SECURITY.md](SECURITY.md).

- Work on a feature branch and open a PR. Never push to `main`.
- Read [AGENTS.md](AGENTS.md) before writing security-relevant code, and cite requirement IDs (FR, NFR, SR) in commits.
- New routes or pages go in the entry point inventory in [docs/threat-model.md](docs/threat-model.md) §1.4.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `required variable ... is missing a value` | Add `ENV_FILE=.env.local` to the command, and run `make env-local` once |
| Port 80 or 443 already in use | Stop the other service (or a previous stack: `make down`) |
| Database password rejected after editing `.env.local` | Restore the original secure configuration or coordinate database credential rotation; do not delete data |
| Docker build fails at `binaries.prisma.sh` with `self-signed certificate` | Your network inspects TLS. Export your CA bundle and point the build at it (below) |

### Build fails with `self-signed certificate` (corporate network)

Your network inspects TLS, so the image build can't verify Prisma's download. Export your machine's trusted certificates and rebuild:

```
make ca-bundle                     # macOS, Linux, or WSL2; writes ca-bundle.pem and sets EXTRA_CA_CERT in .env.local
make up ENV_FILE=.env.local
```

This adds trust for your network's CA; it does not disable certificate checking. `ca-bundle.pem` is git-ignored. On other setups, point `EXTRA_CA_CERT` in `.env.local` at any PEM file.

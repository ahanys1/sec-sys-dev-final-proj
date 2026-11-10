# AGENTS.md

Instructions for any AI agent (Claude, Copilot, ChatGPT/Codex, Cursor, etc.) working in this repo.

## Project
Secure incident-reporting web app (CS 5343 final project). **`ASSIGNMENT.md` is the spec.** Cite requirement IDs (FR-x, NFR-x, SR-x) in commits, PRs, and non-obvious code comments.

## Mandatory: log all AI usage
Every AI-assisted change must add an entry to `AI-USAGE-REPORT.md` **in the same commit**, using the existing template:

```
### Commit <commit subject>
#### <Developer>'s Agent
- What the AI produced
- Human/security changes made to it, and why
```

Record every human edit to AI output, especially security fixes. The commit hash isn't known before committing, so use the subject line.

## Deliverables
- Written deliverables live in `docs/` (one stub per deliverable).
- Team members' names appear **only** in `docs/cover-page.md`; every other document uses the team number only.
- Never use real personal data in code, seeds, or tests (ASSUMP-2).

## Stack and commands
Next.js (App Router) + TypeScript.

```
npm install
npm run dev     # local dev server
npm run build
npm run lint
npm test
```

`make help` lists the same tasks as targets (`make dev`, `make test`, `make check` = lint + test + build + audit). Add new common tasks to the `Makefile`.

Test runner: Vitest (`tests/**/*.test.ts`, `@/*` alias works in tests).

TODO: decide and record here: database/ORM, SAST tool, DAST tool.

## Security (non-negotiable)
Target: **OWASP ASVS 5.0.0 Level 2**. The assignment's SR/FR/NFR requirements are mandatory and **override ASVS** when stricter or in conflict. Cite both in code comments, commits, and PRs (e.g. `SR-4, ASVS V8.2.1`).

**Before writing security-relevant code**, read `docs/asvs/assignment-mapping.md` plus the chapter file(s) for your area:

| Area | Read |
|---|---|
| Login, passwords, credentials | V06, V11 |
| Sessions, cookies, logout | V07, V03 |
| Roles, access control | V08 |
| Forms, input, DB queries, output | V01, V02 |
| API routes, headers, CORS | V04, V03 |
| File uploads | V05 |
| Audit log, errors | V16 |
| Config, secrets, TLS, data handling | V13, V12, V14 |
| Dependencies, general coding | V15 |

When a change satisfies a requirement, set it to `Done` with evidence (file path or test name) in the same commit. Never mark `Done` without evidence.

Key rules (full lists in `docs/asvs/`):
- Check authentication and RBAC inside every route handler and Server Action; never rely on middleware alone (SR-1, SR-4, SR-5; ASVS V8.2.1, V8.3.1).
- Users cannot change their own role (SR-6; V15.3.3).
- Validate all input with a schema (SR-7; V2.2.1, V2.2.2). Parameterized queries or ORM calls only, never string-built SQL (SR-8; V1.2.4).
- Session cookies: `httpOnly`, `secure`, `sameSite` (SR-3; V3.3.1, V3.3.2, V3.3.4). Hash passwords with an approved KDF such as argon2id or bcrypt (SR-2; V11.4.2).
- Secrets only in `.env*`, never committed; keep `.env.example` with placeholders (SR-14; V13.3.1).
- Audit log is append-only and records userId, timestamp, action, targetId. It never contains passwords, tokens, or incident descriptions (FR-11, FR-12, SR-9 to SR-11; V16.2.1, V16.2.5, V16.4.2).
- Generic errors to clients; details to server logs only (NFR-2, SR-12, SR-13; V16.5.1, V16.3.4).

## Layout
- `ASSIGNMENT.md`: spec
- `AI-USAGE-REPORT.md`: AI usage log
- `docs/`: report deliverables
- `docs/asvs/`: security requirements checklist (assignment mapping + ASVS chapters)
- App code: repo root (Next.js `app/`, `src/`) once created

## Git
Work on feature branches and merge via PR; never push directly to `main`.

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

TODO: decide and record here: database/ORM, test runner, SAST tool, DAST tool.

## Security rules (non-negotiable)
- Check authentication and RBAC inside every route handler and Server Action; never rely on middleware alone (SR-1, SR-4, SR-5).
- Users cannot change their own role (SR-6).
- Validate all input with a schema (SR-7). Use parameterized queries or ORM calls only, never string-built SQL (SR-8).
- Session cookies: `httpOnly`, `secure`, `sameSite` (SR-3). Hash passwords with bcrypt or argon2 (SR-2).
- Secrets only in `.env*`, never committed; keep `.env.example` with placeholders (SR-14).
- Audit log is append-only and records userId, timestamp, action, targetId. It never contains passwords, tokens, or incident descriptions (FR-11, FR-12, SR-9 to SR-11).
- Generic errors to clients; details to server logs only (NFR-2, SR-12, SR-13).

## Layout
- `ASSIGNMENT.md`: spec
- `AI-USAGE-REPORT.md`: AI usage log
- `docs/`: report deliverables
- App code: repo root (Next.js `app/`, `src/`) once created

## Git
Work on feature branches and merge via PR; never push directly to `main`.

# Team #13 delivery plan (for developers and their agents)

This file is the tracker. It lists the slices in the order we build them, what each must contain, and where it stands. The GitHub issues (#1 to #22) describe what "done" means for each requirement, but they are not kept current, so don't use them for status.

## Pick up work
1. Read `docs/sdl.md` (current phase), `AGENTS.md`, and the slice table below.
2. `gh pr list` shows who is working on what. Take the first slice whose dependencies are met and whose status is **Next**.
3. **Claim it** by opening a draft PR early with the slice name in the title, and set its status to **In progress** in the table (with the PR number). Two people must not build the same slice.
4. Read the slice's entry points (`docs/threat-model.md` §1.4), threats (`docs/stride.md`), and the ASVS chapters named in `AGENTS.md`.
5. Branch from `main`. Stack on an open PR only if you depend on its code, and merge stacks bottom-up promptly.
6. When the slice is done, set its status to **Done** in the same PR (`#PR`).

## Definition of done (every PR)
- Tests: happy path plus a denied case per route (wrong role, no session, foreign record), and database tests in `tests/db/` for anything that touches data.
- `make check` and `make test-db` pass.
- Entry point inventory row added or updated; ASVS and assignment rows set to `Done` **with evidence** (file or test name), never without.
- An `AI-USAGE-REPORT.md` entry in the same commit, including what you fixed in the AI's output and why.
- This table updated, and the PR says what was **not** verified.

## Slices, in order
Status values: Done, In review, In progress, Next, Blocked. "Acceptance criteria" are the issues that define done; tick their boxes in your PR description if useful.

| # | Slice | Depends on | Status | Acceptance criteria |
|---|---|---|---|---|
| 1 | Foundation: lint bans, CI, Docker stack, database schema, proxy and shared libraries, image checks | none | Done (#34 to #37) | #2, #3, #11 (part), #12 (part) |
| 2 | Auth and sessions: login, logout, password change, lockout, first-admin CLI | 1 | Done (#38) | #4, #5 (part) |
| 3 | Admin accounts | 2 | Done (#51) | #6, #5 |
| 4 | Incidents and comments | 2 | Done (#54) | #7, #8 |
| 5 | Audit view and settings | 2 | Done (PR #53 merged) | #9, #10 |
| 6 | Live deployment | 3, 4 (grader accounts need all three roles) | Done (#57, #59 deployed): live at the sslip.io host, checks in `docs/deployment.md`; demo script in `docs/user-manual.md` (#55); redeployed 2026-11-25 at `3b2925c` with migration 0003 (#66) | #12, #21 |
| 7 | Verification | 3, 4, 5 | Done: local verification (#63, #65): SAST, per-role ZAP, 151 HTTP checks, 50-user performance, encrypted restore and outage drill, manual MAN tests. Findings register and High-threat test map in `docs/security-testing.md` §5; CodeQL has 0 alerts. Accepted as exceptions in the final review: no ZAP scan of the live site; app logs alterable by a host operator (AR-1) | #13, #14, #16, #17 |
| 8 | Release | 7 | Done: `v1.0.0` tagged on `38a12ba`. Manual and packaging (#55), OWASP principles (#62), `SECURITY.md` and incident response (#68), findings register (#69), final security review Pass with exceptions (#71) | #18 to #20, #22 |

Slices 3, 4, and 5 are independent once slice 2 merges and can run in parallel. Everything is due Nov 25.

### Slice 3: Admin accounts (EP-12 to EP-17)
`generateTemporaryPassword` (CSPRNG, shown once with `no-store`, expires after `tempPasswordHours`, sets `mustChangePassword`); create, update username, role change, deactivate, password reset; the target must differ from the caller (SR-6); the last active admin is protected with `serializable`; deactivate and reset call `destroyUserSessions`; mass-assignment tests (`role` and `active` rejected on profile edits); the admin users page. Flips V6.4.1 and V7.4.2.

### Slice 4: Incidents and comments (EP-07 to EP-11, EP-19, EP-21 to EP-23)
Users submit incidents and see their own list; reviewer queue (open and under-review only) and detail; admin sees all; status moves only open to under-review to closed via `updateMany` with an expected status; category must exist and be active; the same 404 for missing and forbidden (T-25); lists never return descriptions; comments by reviewer and admin; every action audited with the existing action names; pages for each role.

### Slice 5: Audit view and settings (EP-18, EP-20)
Admin-only audit view with filters and paging, never showing descriptions or secrets; settings validated with `LIMITS`, audited with old and new values, a missing or invalid row falling back to defaults; a logout link on every authenticated page (V7.4.4).

**Implementation status (PR #53):** Backend and frontend implemented for EP-18 and EP-20. Includes admin-only audit history with action/date filtering and pagination; settings management with bounded validation, default fallbacks, and transactional audit records containing old/new values; and admin-only navigation with server-side authorization. Logout remains available on authenticated pages.

**Verification:** All 56 database tests passed across six test files, and all seven GitHub Actions checks passed. Browser testing confirmed settings persistence, audit history filtering, invalid date-range handling, and non-admin access restrictions (404 for admin pages and 403 for admin APIs). Pagination is implemented but has not yet been manually exercised with more than 25 records.

### Slice 6: Live deployment (no new entry points)
Threat-model PR first (re-rate T-06, T-51, T-52, T-63; add an accepted risk scoped to the grading window). One small host running the same compose stack, only 80 and 443 open, no SSH. Grader accounts made with `make create-admin` and the admin screens, credentials shared privately. Demo script in `docs/user-manual.md`. Decided: AWS EC2 (SSM, no SSH); one team member generated the dotenvx key, held in Secrets Manager; domain is `<elastic-ip>.sslip.io`. Live and redeployed; see `docs/deployment.md`.

### Slice 7: Verification
Run the use and misuse cases, ZAP (baseline and per role, local and live), the MAN-01 to MAN-13 tests, fuzzing of the write endpoints (SDL #12), k6 at 50 users, one backup and restore drill, and the attack-surface review against the built routes (SDL #13). Record results in `docs/security-testing.md`.

### Slice 8: Release
Incident response plan and `SECURITY.md` (SDL #14), final security review (SDL #15), user manual, 10 OWASP principles document, `v1.0.0` tag, live URL in the report, the professor's approval of the live site kept on file in place of the video.

## Reuse these, don't rewrite them
| Need | Use | File |
|---|---|---|
| Route Handler with safe errors and request IDs | `route()`, `ApiError`, `jsonResponse`, `methodNotAllowed` | `src/lib/http.ts` |
| Origin, JSON, 64 KB cap, strict schema | `parseWrite(request, zodSchema)` | `src/lib/request.ts` |
| Who is calling, and the role check | `authenticate(request, { roles })` (handlers), `requirePageUser({ roles })` (pages) | `src/lib/auth/guard.ts`, `page.ts` |
| Change plus audit record in one transaction | `runAudited(db, work, audit)` | `src/lib/audit.ts` |
| Guarded change, retried on conflict | `serializable(db, work)` | `src/lib/tx.ts` |
| End sessions | `destroyUserSessions` | `src/lib/auth/session.ts` |
| Limits and defaults | `getSettings`, `LIMITS` | `src/lib/auth/settings.ts` |
| Passwords | `hashPassword`, `checkNewPassword` | `src/lib/auth/password.ts` |
| Logs | `logger`, `scrubError` | `src/lib/logger.ts` |
| Page header with logout | `AppHeader` | `components/AppHeader.tsx` |
| Test pattern | call route handlers directly with a `Request`, as the app role | `tests/db/auth.test.ts` |

## Traps we already hit
- **Lint bans** (`eslint.config.mjs`): `console.log`, `Math.random`, `child_process`, `innerHTML`, raw Prisma queries, and `"use server"`. Use `logger`, `crypto.randomInt`, and the helpers above. Don't weaken a ban to get a test through.
- **Never echo input** in errors, and never log bodies, passwords, tokens, or descriptions. Errors with a `code` lose their message in logs.
- **Secrets scanning:** gitleaks flags password-like literals, so generate test passwords at runtime. Fixtures use fake data only (ASSUMP-2).
- **`AI-USAGE-REPORT.md` and this table** conflict between branches: append report entries at the end, and on conflict keep both entries.
- **Writes** go through Route Handlers, with `parseWrite` and `authenticate` called inside each one. The proxy never decides access.
- **Audit table** is append-only at the database. Test users that have audit rows can't be deleted.
- **TLS-inspecting networks:** `make ca-bundle`, then `make up ENV_FILE=.env.local`.
- **Pinned versions:** actions are pinned to SHAs and images to digests. Dependabot proposes updates; don't bump by hand without a reason.

## If time runs short
Keep slices 4 and 6 and the audit trail. Cut settings polish, k6 tuning, and extra admin screens first. All High threats and the release gate in `docs/sdl.md` stay mandatory.

### Local regression remediation (#61)

Reconciled EP-08/09/19 with the built routes; enforced summary-only user access, malformed-ID rejection and closed-incident privacy; bounded incident queries and page navigation; consumed temporary credentials atomically; standardized method errors and edge rejection headers. Regression evidence: `tests/db/auth.test.ts`, `tests/db/incidents.test.ts`, `tests/incidents-pagination.test.ts`, `tests/api-methods.test.ts`, `tests/proxy.test.ts`, `tests/security-headers.test.ts`. Verification of these fixes does not complete slice 7 or the release gate.

Validation for #61 (2026-11-24): lint, TypeScript, CI guards, 104 unit tests, 131 PostgreSQL tests, Docker production build, and production dependency audit (0 vulnerabilities) passed. Local HTTPS rechecks verified the targeted controls and all three roles' browser pagination. Native `make check` stops at Turbopack's local worker port-binding permission error even outside the sandbox; the Docker production build passes. No live deployment, full fuzz/load run, or release acceptance is claimed.

### Fresh local verification (#63)

Restarted independently of #56 at developer direction. See `docs/evidence/slice7/README.md` and sanitized `results.json`: 110 unit and 131 DB tests; 151 HTTP checks; local Semgrep clean; ZAP public/per-role passive scans with triage; 50 VUs, 7,960 actions, zero errors, read/write/login p95 12.91/16.52/75.20 ms; identical restore fingerprints and successful DB-outage recovery. Fixed native GET form fallback and adapter transaction-conflict retry. Native wrapper-edit caveat and all scope limits are retained in the evidence.

Still outside this completed local run: live-host scans, broad active scanning, a fresh interactive-browser execution of every use/misuse case, exhaustive fuzzing, independently enumerated CodeQL alerts, production backup scheduling/key custody, and final security/release approval. Audit pagination over 25 records is now exercised over HTTP; this does not claim a new manual browser pagination session.

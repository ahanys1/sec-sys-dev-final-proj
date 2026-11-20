# Team #13 delivery plan (for developers and their agents)

Status and ownership live in **GitHub issues** (`gh issue list`; master tracker #22). This file holds what does not change per task: how to pick up work, what each remaining slice must contain, which helpers to reuse, and the traps we already hit. Don't record per-task status here.

## Pick up work
1. Read `docs/sdl.md` (current phase) and `AGENTS.md`.
2. `gh issue list` and `gh pr list`. Take an unassigned issue and assign yourself, or create one. Don't start work that an open PR already covers.
3. Read the entry points (`docs/threat-model.md` §1.4), the STRIDE threats for the area (`docs/stride.md`), and the ASVS chapters named in `AGENTS.md`.
4. Branch from `main`. Stack on an open PR only if you depend on its code, and merge stacks bottom-up promptly.
5. Open a PR with `Closes #N` or `Refs #N` (the template has the checklist).

## Definition of done (every PR)
- Tests: happy path plus a denied case per route (wrong role, no session, foreign record), and database tests in `tests/db/` for anything that touches data.
- `make check` and `make test-db` pass.
- Entry point inventory row added or updated; ASVS and assignment rows set to `Done` **with evidence** (file or test name), never without.
- An `AI-USAGE-REPORT.md` entry in the same commit, including what you fixed in the AI's output and why.
- The PR says what was **not** verified.

## Slices (issue numbers in brackets)
Done or in review: foundation, auth and sessions (#2, #3, #4, parts of #5, #9, #11). Check `gh pr list` for the current state. Remaining:

| Slice | Issues | Entry points | Must contain |
|---|---|---|---|
| 3 Admin accounts | #6, #5 | EP-12 to EP-17 | `generateTemporaryPassword` (CSPRNG, shown once, `no-store`, expires after `tempPasswordHours`, sets `mustChangePassword`); create, role change, deactivate, reset; targets must differ from the caller (SR-6); last active admin protected with `serializable`; deactivate and reset call `destroyUserSessions`; mass-assignment tests (`role`, `active` rejected on profile edits). Flips V6.4.1 and V7.4.2. |
| 4 Incidents and comments | #7, #8 | EP-07 to EP-11, EP-19, EP-21 to EP-23 | Reporter submit and own list; reviewer queue (open and under-review only) and detail; admin sees all; status moves only open to under-review to closed via `updateMany` with an expected status; category must exist and be active; the same 404 for missing and forbidden (T-25); lists never return descriptions; comments by reviewer and admin; every action audited with the existing action names. |
| 5 Audit view and settings | #9, #10 | EP-18, EP-20 | Admin-only audit view with filters and paging, never showing descriptions or secrets; settings validated with `LIMITS`, audited with old and new values, and a missing or invalid row falling back to defaults; a logout link on every authenticated page (V7.4.4). |
| 6 Live deployment | #12, #21 | none new | Threat-model PR first (re-rate T-06, T-51, T-52, T-63; add an accepted risk scoped to the grading window). One small host running the same compose stack, only 80 and 443 open, no SSH. Grader accounts made with `make create-admin`, credentials shared privately. Demo script in `docs/user-manual.md`. |
| Verification | #13, #14, #16, #17 | all | Run the use and misuse cases, ZAP (baseline and per-role), the MAN-01 to MAN-13 tests, k6 at 50 users, one backup and restore drill. Record results in `docs/security-testing.md`. |
| Release | #18 to #20, #22 | | Final security review (SDL #15), incident response plan (#14), user manual, `v1.0.0` tag, live URL in the report. |

Open decisions: who generates the dotenvx keys for the shared encrypted `.env` (#12), and the live host and domain.

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
- **`AI-USAGE-REPORT.md` conflicts** between branches: append at the end, and on conflict keep both entries.
- **Writes** go through Route Handlers, with `parseWrite` and `authenticate` called inside each one. The proxy never decides access.
- **Audit table** is append-only at the database. Test users that have audit rows can't be deleted.
- **TLS-inspecting networks:** `make ca-bundle`, then `make up ENV_FILE=.env.local`.
- **Pinned versions:** actions are pinned to SHAs and images to digests. Dependabot proposes updates; don't bump by hand without a reason.

## If time runs short (due Nov 25)
Keep slice 4, the audit trail, and the live site. Cut settings polish, k6 tuning, and extra admin screens first. All High threats and the release gate in `docs/sdl.md` stay mandatory.

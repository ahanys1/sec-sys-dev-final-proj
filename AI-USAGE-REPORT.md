# AI Usage Report
## All AI usage must be documented per the assignment's requirements.

### Commit [commit#]
#### Developer's Agent (EX: "Alex's Agent")
- Changes Made

### Commit 45f49c2 (Add final project assignment as ASSIGNMENT.md)
#### Liam's Agent
- Claude converted the assignment PDF to `ASSIGNMENT.md`, keeping the original wording and structure.
- No human changes.

### Commit Add tool-agnostic AI agent scaffolding
#### Liam's Agent
- Claude created `AGENTS.md`, the `CLAUDE.md` and `.github/copilot-instructions.md` shims, `docs/` deliverable stubs, and a Next.js `.gitignore`.
- No human changes.

### Commit Add OWASP ASVS 5.0.0 directives and checklist
#### Liam's Agent
- Claude generated `docs/asvs/` (ASVS 5.0.0 L1/L2 checklist per chapter, from the official CSV; `assignment-mapping.md` mapping ASSIGNMENT.md SR/FR/NFR items to ASVS IDs), and added the security section and routing table to `AGENTS.md` and `.github/copilot-instructions.md`.
- The ASVS ID mappings in `assignment-mapping.md` are Claude's judgment. Liam spot-checked the file and accepted it with no changes. The per-chapter files are unmodified CSV output.

### Commit Add OWASP Top 10 to ASVS mapping
#### Liam's Agent
- Claude wrote `docs/asvs/owasp-top10-mapping.md`, a Top 10:2025 to ASVS crosswalk. Category names come from the OWASP/Top10 repo; the ASVS IDs, coverage ratings, and 2021 equivalents are Claude's judgment. Liam reviewed the file and accepted it with no changes.

### Commit Add SDL practice tracker
#### Liam's Agent
- Claude wrote `docs/sdl.md`: a tracker for the 17 Microsoft SDL practices (from Lesson 04) with status and evidence, a deliverables-to-practices map, and a suggested schedule. It also drafted proposals for the bug bar (#3), the risk assessment answers (#4), the approved tools list (#8), banned functions (#9), and outlines for #14 to #16. It added an SDL section to `AGENTS.md`.
- The statuses, proposed thresholds, P1 privacy rating, and banned list are Claude's judgment and are marked for team confirmation.
- Liam reviewed `docs/sdl.md`. The proposals above still await team confirmation.

### Commit Add Next.js scaffold
#### Liam's Agent
- Claude generated the app with `create-next-app@16.4.6` (App Router, TypeScript, Tailwind, ESLint) in a scratch directory and copied it into the repo, then added Vitest, `tests/next-config.test.ts`, and the README run steps.
- Claude's changes to the generated template, for review:
  - Security (FW-3, FW-4, FW-5; V13.4.2, V15.2.2): `poweredByHeader: false`, `images.unoptimized: true`, and an ESLint rule that fails on `"use server"`.
  - Removed the template's `cacheComponents` and `partialPrefetching` flags: they change caching semantics, and every page here must run its own auth check per request.
  - Removed Google font loading, template SVGs, and external links from the starter page.
  - Bumped `@types/node` to `^24` to satisfy Vitest's peer dependency; dropped `vite-tsconfig-paths` in favor of Vite's built-in tsconfig paths.
  - Reverted a block that `next dev` appended to `AGENTS.md`.
- Claude added a `Makefile` (wrappers over the npm scripts, plus `check` and `audit`) and a `make` note in `AGENTS.md`.
- Known: `npm audit` reports 7 moderate dev-only findings (`minimatch` via `eslint-config-next`'s pinned `typescript-eslint`); production dependencies have none. Not fixable without overriding upstream pins.

### Commit Add attack surface analysis
#### Liam's Agent
- Claude wrote Part 1 (Attack Surface Analysis, SDL Practice #6) of `docs/threat-model.md`: architecture assumptions, trust boundaries and diagram, common controls, an 18-entry-point inventory mapped to FR/SR/ASVS IDs, framework and non-HTTP surfaces, data stores, reduction decisions, and open items. It also recorded the architecture decisions in `AGENTS.md`.
- Liam chose the database (PostgreSQL in Docker, future AWS deployment), session model (server-side DB sessions), API style (Route Handlers only), and password flow (admin temp password + self-service change). The endpoint design, ASVS mappings, and recommendations are Claude's judgment. Claude flagged that the existing `.env*` secrets rule in `AGENTS.md` conflicts with SR-14 (open item D-4).
- Liam resolved open items D-1 (users can see their own reports) and D-3 (admins can't change incident status). Claude added entry point EP-19 and updated EP-10, R-14, the data store table, and the §1.9 counts to match.
- Liam resolved D-2 as option B (bounded admin settings plus incident categories) and chose which settings to include from Claude's suggestions. Claude added entry points EP-20 to EP-23, the §1.4.1 settings table (defaults and allowed ranges are Claude's suggestions), the new data stores and audit actions, and updated R-9, D-5, and the §1.9 counts.
- Claude Cowork, at Liam's request, added the Part 2 (Threat Model, Practice #7) outline to `docs/threat-model.md`: DFD, STRIDE per element, DREAD and bug bar, misuse cases and tests. It is an outline only, to be filled in next.
- Liam reviewed `docs/threat-model.md` in full.

### Commit Add STRIDE threat model
#### Liam's Agent
- Claude wrote Part 2 of `docs/threat-model.md` (Mermaid level 0 and 1 DFDs, element and flow tables, bug bar, D-4 and D-5 resolutions, handoff list for misuse cases) and `docs/stride.md` (64 threats with STRIDE, DREAD, mitigations, coverage table, accepted risks). The tables were generated by a script that checks every element, entry point, and ASVS ID is covered or exists, and computes the DREAD averages.
- Liam chose the file layout (full table in `stride.md`), Mermaid for DFDs, and dotenvx for D-4. Another engineer owns the use and misuse cases.
- Claude's judgment, pending team review: all DREAD scores, the severity of each threat, the accepted risks (AR-1 to AR-7), the D-5 values (5-session cap, password-change default), and six design changes applied to Part 1 (DC-1 to DC-6: C-11, tightened C-4 and C-8, DB-backed lockout state with a `login_attempts` store, CLI audit record, offline breached-password list). Also updated `AGENTS.md` (secrets rule), `docs/sdl.md` (#6 Done, #7 in review).

### Commit Revise OWASP principles for design-phase team review
#### Jonathan's Agent
- Codex revised `docs/owasp-design-principles.md` against ASSIGNMENT.md, the current attack-surface design, and Lesson 17 slide 26, preserving the original ten-section structure and requirement/verification format.
- Corrected SR-14 to prohibit unencrypted secret storage; clarified administrator viewing/commenting, reviewer-only status/classification, and the prohibition on self-role changes for all roles. Distinguished role separation from independent approval and planned controls from verified implementation.
- Flagged unresolved local secrets/key handling and audit-failure/transaction coverage; corrected error/logging and SR-16 descriptions. Verification activities remain plans, not reported results.
- Human direction: after an initial expanded AI revision, the developer requested a narrower revision retaining the original format. Team review and any subsequent human/security edits remain pending; no human acceptance or test completion is claimed.

### Commit Draft SAST methodology and threat-based testing plan
### Jonathan's Agent
- Reviewed the team's `docs/stride.md` and `docs/threat-model.md` to identify security threats relevant to Static Application Security Testing (SAST).
- Assisted in drafting the SAST methodology for `docs/security-testing.md`, including objectives, tool selection, analysis procedures, findings documentation, and limitations.
- Mapped proposed source-code inspections to STRIDE threats, including stored XSS (T-29), SQL injection (T-38), privilege escalation (T-19), mass assignment (T-17), audit tampering (T-33), framework authorization bypass (T-43/T-45), secrets exposure (T-53), and AI-generated vulnerabilities (T-60).
- Suggested Semgrep as the primary SAST tool, with ESLint and TypeScript checks as supplementary analysis. Distinguished SAST from dependency vulnerability scanning (`npm audit`), DAST, and manual security testing.
- Human direction: the developer requested a threat-based testing methodology aligned with the team's design documents and assignment requirements. The proposed testing activities remain unverified; no SAST scans, vulnerability confirmations, or remediation testing have been completed.

### Commit Draft DAST and manual security testing methodology
### Jonathan's Agent
- Assisted in drafting the DAST methodology for `docs/security-testing.md`, proposing OWASP ZAP for baseline, authenticated, and targeted security testing of the running Next.js application.
- Reviewed the team's STRIDE analysis and threat model to identify DAST priorities, including authentication, session management, CSRF, privilege escalation, IDOR, stored XSS, SQL injection, and middleware authorization bypass.
- Assisted in drafting the manual security testing methodology, focusing on application-specific authorization, role restrictions, incident ownership, audit integrity, and deployment security.
- Developed a proposed manual testing matrix (MAN-01 through MAN-13), mapping test scenarios to STRIDE threat identifiers and expected security behavior. Distinguished positive authorization tests from negative tests.
- Human direction: the developer reviewed the proposed methodologies, incorporated the testing matrix, and requested consistent documentation formatting. Testing procedures remain planned activities; no DAST scans, manual security tests, or vulnerability remediation have been completed.

### Commit Refine security testing plan with use/misuse case traceability
### Jonathan's Agent
- Reviewed the team's `docs/use-misuse-cases.md` and compared its intended use cases (UC-01 through UC-10) and misuse cases (MC-01 through MC-13) against the existing security-testing methodology.
- Assisted in developing Section 4 of `docs/security-testing.md`, mapping misuse cases to their associated STRIDE threats and proposed verification methods, including SAST, DAST, automated integration tests, manual security testing, dependency scanning, and deployment configuration checks.
- Identified refinements to the manual testing matrix, including HTTP 404 responses for unauthorized incident access, audit-failure rollback verification, origin/CSRF protections, and session revocation.
- Helped establish test result classifications and evidence requirements, including tested commits, expected and observed behavior, remediation references, and retesting.
- Human direction: the developer requested alignment with the team's finalized use/misuse cases while preserving the existing SAST, DAST, and manual testing structure. All verification activities remain planned; no security scans or manual test executions are claimed.

### Commit Align SDL approved tools with security testing plan
### Jonathan's Agent
- Reviewed the SDL Practice #8 approved-tools table against the proposed SAST, DAST, and manual security testing methodology.
- Suggested updating the test runner to Vitest and listing Semgrep and OWASP ZAP as proposed security-testing tools pending team approval.
- Distinguished tool selection and configuration from completed security testing.
- Human direction: the developer identified outdated TODO entries in `docs/sdl.md` and requested alignment with `docs/security-testing.md`. No security scans or test execution are claimed.

### Commit Document use and misuse verification cases (FR-1 to FR-13, SR-1 to SR-14, SR-16)
#### Alex's Agent
- Codex drafted the use and misuse case verification plan, mapped the cases to assignment requirements, ASVS 5.0.0, and STRIDE, and recorded the plan in the SDL tracker for Practices #7 and #11.
- Case grouping, test fixtures, and demo order are Codex's drafting decisions. Human review and security edits are pending. These cases have no execution results yet.


### Commit docs: add design document (FR-1 to FR-13, SR-1 to SR-14, SR-16)
#### Alex's Agent
- Codex drafted architecture, roles, data model, workflows, security controls, deployment, requirement traceability, and an unresolved-decision register in docs/design.md. Updated SDL Practice #5 and the ORM selection.
- The developer delegated the ORM choice, selected Caddy, and requested unresolved details be documented for later answers. Codex selected Prisma after consulting its official transaction and query documentation. Exact package versions remain open.
- Human review and subsequent security edits are pending. No implementation or passing security tests are claimed.

### Commit docs: address design review (SR-8, SR-14, FR-12)
#### Alex's Agent
- Codex addressed reviewer corrections to design and threat-model consistency, scoped database deletion, encrypted-env tracking, middleware, selected tools, and team 13 identification.
- Reviewer recommendations for unresolved implementation choices remain proposals awaiting developer answers. Copilot usage evidence remains pending and is not claimed.
- Human direction supplied team number 13. Subsequent human/security edits remain pending.


### Commit docs: complete design review and synchronize questions (SR-8, NFR-8)
#### Alex's Agent
- Codex added ASVS references to the design traceability matrix, finished framework and database documentation corrections, and set Node 24 in package engines, lockfile metadata, and .nvmrc following review.
- Updated open questions to remove decided items and request factual Copilot usage evidence. Exact dependency versions and unapproved reviewer recommendations remain pending developer answers.
- Human direction keeps PR #29 open and PR #30 stacked on it. Team identification remains 13. No Copilot activity is invented.


### Commit docs: record approved design answers (NFR-3, NFR-5, SR-2, SR-14)
#### Alex's Agent
- Codex incorporated the reviewer-supplied answers into the design, updated SDL/tool decisions and threat-model consistency, and recorded the Caddy HTTP-hop risk as AR-8.
- The developer explicitly approved the reviewer answers. Answered questions were removed from the design and PR description. Q-13 remains open because actual Copilot work and human edits require factual evidence.
- Exact package versions and container digests are deferred to implementation under the approved selection process. No dependency installation, implemented controls, measured performance, or restore results are claimed.


### Commit docs: track Copilot evidence in AI report (CONST-3, NFR-8)
#### Alex's Agent
- Codex removed the remaining Copilot evidence question from the design and PR description and pointed the design traceability entry to this report.
- The developer directed that Copilot usage evidence be handled in the AI usage report.

### Commit Merge main into fix/design-doc (resolve SDL tools conflict)
#### Liam's Agent
- Resolved the `docs/sdl.md` Approved tools conflict between #31 (Semgrep and ZAP "proposed") and the team-approved design decisions (Semgrep CE and CodeQL, ZAP baseline plus authenticated scans, Prisma, argon2, k6). Kept the approved decisions; dropped the superseded "proposed" rows.

### Commit docs: move SDL to implementation, confirm banned functions (Practice #9)
#### Liam's Agent
- Updated `docs/sdl.md` (current phase, #9 row, banned-functions heading, revision history) and `AGENTS.md` (Zod, node-argon2, banned-functions rule).
- Human direction: the developer reported team confirmation of the banned-functions list. #9 stays "In progress" because lint and CI enforcement are not yet implemented; #4 is left unconfirmed because the team did not confirm it.

### Commit feat: enforce banned functions in lint and CI (SDL #9, SR-2, SR-7, SR-8, SR-9, FW-3)
#### Liam's Agent
- Added ESLint bans for the Practice #9 list, a test per banned API (`tests/lint-bans.test.ts`), a Node guard for Server Actions and a published PostgreSQL port (`scripts/ci-guards.mjs`), and CI workflows for `make check`, gitleaks, Semgrep CE, and CodeQL.
- Caught in testing: the MD5/SHA-1 selector initially missed an imported `createHash` call, so it was fixed to match both forms. Plain SHA-256 for passwords can't be detected by lint and stays a code-review item.
- Not yet verified: the workflows haven't run in CI. Actions are pinned to major tags, not SHAs, and the Semgrep image is `latest`; pin both before release.
- Human direction: the developer confirmed SDL #4 and the banned-functions list, and I updated #4, #5, #7, #9, and #10 in `docs/sdl.md` to match.

### Commit feat: add Docker stack, Prisma schema, and audit-safe migrations (SR-8, SR-11, FR-12, T-33, T-42, T-52)
#### Liam's Agent
- Added `docker-compose.yml` (Postgres with no published port, Caddy, app, migrate job), `Dockerfile`, `Caddyfile`, role init script, `.env.example`, the Prisma schema from design §4, two migrations, a Prisma client module, and database tests.
- Security changes found during the work: `npm audit` flagged a high ReDoS in `effect` through the Prisma CLI, so it is overridden to a patched 3.22.5; the app and owner roles are separate and the app role has no DDL or audit UPDATE/DELETE, and the trigger also blocks TRUNCATE.
- Verified locally against Postgres 18: all 7 database tests pass, and the audit trigger rejects UPDATE/DELETE/TRUNCATE even for the owner.
- Not verified: the Docker image build, because local builds fail at Prisma's engine download behind this network's TLS inspection. CI will be the first real image build. No encrypted `.env` was created; the team must generate the dotenvx keys and share them through the password manager.

### Commit docs: rewrite README with local setup and run guide
#### Liam's Agent
- Rewrote `README.md` as a start-to-finish local guide (app only, full HTTPS stack, daily commands, DB changes, troubleshooting). Added `make env-local`, `make test-db`, `make reset`, `make logs`, and an `ENV_FILE` option to `make up/down/migrate`.
- Fixed in testing: the `.env.local` generator reused one `awk` pipe, which would have given every secret the same value; it now closes the pipe each time. The CI database wait now polls over TCP, because `pg_isready` can pass during the init phase before the roles exist.
- Replaced the author names in the README with the team number (AGENTS.md: names only on the cover page) and corrected the Node requirement from 20.9+ to 24.
- Verified: `make test-db` passes and removes its container, and the password generator yields distinct values on sample input. Not verified: `make env-local` on the real `.env.example`, `make up`, `make migrate`, and the optional certificate-trust commands (macOS), because the sandbox blocked `.env.local` access and the image build fails behind this network's TLS inspection.

### Commit chore: npm audit fix (dev tooling)
#### Liam's Agent
- The lockfile update came from the developer running `npm audit fix`, not from the AI. The AI reviewed the diff (transitive dev-tooling bumps only, `package.json` unchanged), confirmed `make check` passes, and committed it.

### Commit build: allow a corporate CA bundle for the image build
#### Liam's Agent
- The developer's `make up` failed at Prisma's engine download with `self-signed certificate in certificate chain`, a TLS-inspecting network. Added an optional BuildKit secret (`EXTRA_CA_CERT`) that sets `NODE_EXTRA_CA_CERTS` for that one build step, plus a portable `make ca-bundle` target (macOS, Linux, WSL2) that exports the system trust store, and README steps for it.
- Security choice: the build trusts the network's CA instead of disabling certificate verification (`NODE_TLS_REJECT_UNAUTHORIZED=0`), which an automated check also blocked. With the secret unset the build is unchanged.
- Verified: the compose file validates, and a throwaway Dockerfile showed the secret mount is empty for `/dev/null` and an unset secret and present for a real file. Not verified: a full image build on the inspected network with a real CA bundle; the developer needs to run that.
- Also fixed a CI failure Semgrep reported on the workflows (10 findings, all mutable action tags): every action is now pinned to a commit SHA and the Semgrep image to a digest. Keep them current when updating actions.
- Portability review: the developer noted other people will use the environment, so macOS-only commands were replaced and the pinned image digests were confirmed multi-arch (amd64 and arm64).

### Commit feat: add proxy, shared request/error/logger/audit libraries (C-4, C-7, SR-7, SR-9, SR-12, SR-13, FR-11, T-43)
#### Liam's Agent
- Added `proxy.ts` (CSP nonce, security headers, rejection of `x-middleware-subrequest`), `src/lib/` modules for security headers, JSON/origin checks, error responses, a field-allowlist logger, and a transactional audit writer, plus `/api/health`, generic error pages, and a Caddy rule for the subrequest header. Next 16 renamed middleware to `proxy`, so the file is `proxy.ts`; the design table now says so.
- Security fix found by a test: `scrubError` first kept error messages unless the error name started with "Prisma", which would still log query arguments from errors with another name and Postgres input values. It now drops the message for any error with a string `code`.
- Tooling issue fixed: a ` ` escape in the logger was converted to raw line separators and broke parsing, so the regex is built from char codes.
- Verified: 52 unit tests and 9 database tests pass (audit commits with the change and rolls back when the audit insert fails). Against a production build, `curl` showed the CSP with a fresh nonce on pages, API, and 404 responses and on the scripts, static headers on build output, 405 for POST and OPTIONS on `/api/health`, and 400 for the subrequest header.
- Not verified: browser behavior of the CSP (inline styles), and the Caddy rule, which needs the running stack. ASVS rows stay TODO until handlers use these libraries.

### Commit ci: add image-build check and Dependabot (T-61, T-47, T-44, T-59)
#### Liam's Agent
- Added `scripts/check-image.sh` (builds the runtime and migrate images; asserts the runtime image is non-root and has no env files, `.git`, or source maps), a CI `image` job and `make check-image` that run it, and `.github/dependabot.yml` for npm, GitHub Actions, Dockerfile, and compose updates.
- Security finding from the new check: the runtime image shipped four server-side `.js.map` files from Turbopack, contrary to the threat model's no-source-maps control. The Docker build now deletes them, and `next.config.ts` states `productionBrowserSourceMaps: false` explicitly, with a test.
- Fixed while testing: `find` exits non-zero when it can't read a path, which silently aborted the script under `set -e`.
- Verified: the script built both images with the CA-bundle secret and passed, and the same assertion failed before the source-map deletion. Not verified: the CI `image` job on GitHub's runners, and the Dependabot schedule. Dependabot does not cover the Semgrep image referenced in `sast.yml`.

### Commit ci: add a 7-day Dependabot cooldown
#### Liam's Agent
- Semgrep (`dependabot-missing-cooldown`) blocked PR #37 because the Dependabot config proposed brand-new releases immediately. Added `cooldown: default-days: 7` to all four ecosystems, which delays proposals for newly published versions (a supply-chain safeguard, T-59) without delaying security updates.

### Commit feat: add authentication, sessions, password change, and first-admin CLI (SR-1 to SR-3, FR-4, FR-5, T-01 to T-16)
#### Liam's Agent
- Added `/api/auth/login`, `/api/auth/logout`, `/api/account/password`, the login, home, and change-password pages, server-side sessions (hashed 256-bit tokens, idle and absolute timeouts, five-session cap, role read from the database), database-backed lockout and IP limits, argon2id hashing with a four-hash concurrency cap, a bundled offline common-password list (SecLists, MIT), the temporary-password gate, and `scripts/create-admin.ts` run through an `ops` container.
- Marked 28 ASVS and assignment rows Done with test evidence (V3.3, V6.2, V6.3.1, V6.3.2, V7.2 to V7.4.1, V7.4.3, V11.4.2, V11.5.1, SR-2, SR-3). Left V6.4.1, V7.4.2, V7.4.4, V2.4.1, and SR-1 as TODO until temporary passwords, the deactivate endpoint, every authenticated page, and the remaining endpoints exist.
- Caught by lint, then fixed: the retry jitter used `Math.random`, which the SDL #9 ban rejected; it now uses `crypto.randomInt`. A test spawning the CLI hit the `child_process` ban, so the logic moved into `src/lib/auth/create-admin.ts` and is tested directly instead of weakening the ban.
- Cleaned the downloaded password list of `$HEX[...]` and test entries, and committed its SHA-256, which a test checks.
- Verified: 72 unit and 32 database tests pass. Against the real runtime image, `curl` showed the expected 307 redirect, identical 401 bodies for unknown user and wrong password, a hardened cookie, logout with `Clear-Site-Data`, a redirect afterwards, no passwords or submitted usernames in the logs, and a hash plus a system-actor audit record in the database. The CLI refused a short password in its container.
- Not verified: the pages in a real browser, including the CSP with the form scripts, and the Caddy path. Login throttling by IP uses the `X-Forwarded-For` value Caddy sets, which only the full stack exercises.

### Commit fix: clear gitleaks false positive in auth tests
#### Liam's Agent
- Gitleaks (`generic-api-key`) blocked PR #38 on a fake password constant in `tests/db/auth.test.ts`. The test passwords are now generated per run with `randomUUID()`, so no password-like literal is in the repo.
- Because gitleaks scans every commit in a PR, the finding in the earlier commit would still fail, so `.gitleaksignore` records that one fingerprint with a comment. Reproduced and verified locally with the gitleaks image: the PR commit range and the whole history report no leaks, and the tracked files scan clean.
- After rebasing the stack onto `main` (to drop squash-merged commits), the auth commit hash changed, so the `.gitleaksignore` fingerprint was updated to the new hash. Fingerprints are tied to the commit hash and must be refreshed on any rebase.


### Commit docs: add the delivery plan, PR template, and agent start-here guidance
#### Liam's Agent
- Added `docs/plan.md` (how to pick up work, remaining slices with entry points and must-haves, reusable helpers, traps already hit), a pull request template, and a "Start here" section in `AGENTS.md` and `.github/copilot-instructions.md`.
- Design choice: status and ownership stay in the existing GitHub issues (#1 to #22) and master tracker, so the repo file holds only stable guidance and doesn't go stale or conflict between branches. The plan file is free of personal names, per the cover-page rule.
- Not verified: that a fresh agent session picks the right next slice from these files.

### Commit docs: make docs/plan.md the ordered slice tracker
#### Liam's Agent
- Reworked `docs/plan.md` into the tracker: slices in build order with dependencies and status, a claim-by-draft-PR rule, and per-slice must-haves, and updated `AGENTS.md`, the Copilot instructions, and the PR template to match.
- Human direction: the developer judged the GitHub issues unreliable for tracking (written Nov 7, never updated, horizontal layers) and said ordered, representative slices are enough, so the issues are now only acceptance criteria. This reverses the earlier choice to keep status in the issues. Added fuzz testing, the incident response plan, `SECURITY.md`, and the final review to the slices, which no issue covered.

### Commit docs: mark slices 1 and 2 done in plan.md
#### Liam's Agent
- Set slices 1 and 2 to Done in `docs/plan.md` now that #34 to #38 are merged. Human catch: the developer noticed the table still said "In review"; the table is only useful if it is updated when PRs merge.

### Commit docs: claim slice 3 (admin accounts)
#### Liam's Agent
- Set slice 3 to In progress in `docs/plan.md` and opened a draft PR to claim it, per the pick-up rules. No code yet.

### Commit feat: add admin account management (EP-12 to EP-17; FR-1 to FR-3, FR-11, SR-6)
#### Liam's Agent
- Added `src/lib/admin/` (strict schemas, temporary-password generator, list, create, rename, role, status, and reset operations, admin guard), the six admin Route Handlers, the `/admin/users` page and client component, an admin "Users" link, 15 unit and database tests, and Done rows for V6.4.1, V7.4.2, and SR-6.
- Security decisions made while building it: admin handlers check the origin, then authenticate and require the admin role, before reading any body; role, status, and reset all refuse the caller as the target (this extends EP-17, so the threat model row now says so); role and status changes run Serializable with the audit insert in the same transaction, and a last-active-admin check inside it; the temporary password is returned only in a `no-store` response and never logged, audited, or listed; the list uses an explicit field allowlist so the hash is never selected; a no-op role or status request writes no audit record.
- Test fix: the last-admin concurrency test needs exactly two active admins, so DB test files now run one at a time (`--no-file-parallelism` in `scripts/test-db.sh`) and the test parks other admins and restores them.
- Left TODO on purpose: V7.4.5 (no explicit "terminate sessions" action), V15.3.3 and V8.2.x (incident routes are not built yet).
- Not verified: the page in a real browser (CSP with the client component) and the Caddy path.

### Commit chore: apply Dependabot updates in one PR and tune its config
#### Liam's Agent
- Combined Dependabot PRs #40, #42, #43, #44, #45, #46, #47, and #49 into one branch (actions to checkout 7.0.1, setup-node 7.1.0, gitleaks-action 3.0.0, codeql-action 4.39.3; React 19.3.1; Tailwind 4.3.5), and pinned TypeScript to 5.9.3 (it was `^5`).
- Security checks on the AI's work: compared each pinned action SHA with the upstream tag via the GitHub API (all matched); `npm ls` is clean; `make check`, `make test-db`, and `make check-image` pass.
- Declined, with reasons recorded in `.github/dependabot.yml`: #48 TypeScript 7 (typescript-eslint does not support it, `make lint` fails), #50 ESLint 10 (`eslint-config-next` plugins declare ESLint 9 only, `npm ls` reports invalid peers, and lint bans are an SDL control), #41 Node 26 image (the image must match `.nvmrc`, which dev and CI use). ESLint stays on 9.39.5.
- Config changes so PRs stop failing: group `react` with `react-dom`, group the CodeQL `init` and `analyze` actions, and ignore the three major bumps above.
- Also set slice 3 to Done in `docs/plan.md`.

### Commit docs: claim user manual and source packaging (NFR-8, NFR-9)
#### Alex's Agent
- Claimed issue #20 on a feature branch and marked release documentation in progress in the slice tracker.
- Human direction: begin #20 and open a PR; dependent incident, audit, and settings interfaces remain in other PRs, so this work must not claim final release verification.

### Commit docs: add user manual and source export (NFR-8, NFR-9, SR-14)
#### Alex's Agent
- Produced the user manual, component/packaging guide, committed-source export target with SHA-256 checksum and export exclusions, README corrections, and SDL/plan evidence for PR #55.
- Human direction: begin issue #20 on a new branch and push a PR in the existing format. No subsequent human edits to this output at authoring time.
- Security corrections during AI review: removed certificate-bypass and routine destructive-reset advice; documented local plaintext configuration as development-only; kept pending incident/audit/settings workflows and final release evidence explicitly unverified; excluded environment/key/generated files from exports while retaining placeholder configuration. Did not mark broad ASVS requirements Done based on documentation alone.
- Identified the existing conflict between named AI-log headings and submission anonymity; retained provenance and documented a separate submission-rendering gate instead of silently rewriting historical records.
- Validation: shell syntax, documentation links, Make target discovery, and source export checks (repeatability, dirty-tree refusal, and exclusion of synthetic secret-file fixtures). Full application checks require Node 24 and Docker, unavailable in this environment; browser/HTTPS and final integrated release verification remain pending.

### Commit `feat(incidents): add reporter incident creation API and tests`

#### Jonathan's Agent
- Assisted with implementing the reporter-only incident creation endpoint using existing authentication, request validation, and response-handling utilities.
- Assisted with creating strict Zod validation for incident titles, descriptions, and category identifiers.
- Helped implement transactional incident creation and audit logging, ensuring invalid or inactive categories are rejected and incident descriptions are excluded from creation responses.
- Assisted with PostgreSQL-backed integration tests covering successful creation, invalid categories, unauthenticated requests, unauthorized roles, and mandatory password changes.
- Helped diagnose a test fixture failure caused by the database username-format constraint and correct the generated test usernames.
- Human validation: reviewed and adjusted the implementation, resolved formatting issues, and executed TypeScript, ESLint, and database integration tests. All 52 database tests passed across five test files.

### Commit `feat(incidents): add reporter listing and role-aware incident details`

#### Jonathan's Agent
- Assisted with implementing the reporter-only incident listing and role-aware incident detail endpoints using existing authentication and response-handling utilities.
- Helped implement Prisma queries that restrict reporter listings to their own incidents, limit reviewer detail access to open and under-review incidents, and allow administrators to view incidents regardless of status.
- Assisted with validating incident identifiers and returning consistent `404` responses for missing, malformed, and unauthorized incident requests.
- Helped troubleshoot TypeScript errors involving Prisma status filters and inferred types.
- Assisted with PostgreSQL-backed integration tests covering reporter ownership, reviewer and administrator access, closed incident restrictions, unauthenticated requests, and missing or malformed identifiers.
- Human validation: reviewed the implementation against `ASSIGNMENT.md` and `docs/plan.md`, adjusted the code and tests, and verified TypeScript and database integration tests. All 62 database tests passed across five test files.

### Commit `feat(incidents): add reviewer incident queue API and tests`

#### Jonathan's Agent
- Assisted with implementing the reviewer-only incident queue endpoint using the existing authentication, database, and HTTP response utilities.
- Helped implement PostgreSQL queries that return open and under-review incidents across reporters while excluding closed incidents and incident descriptions.
- Assisted with database integration tests covering reviewer access, status filtering, multiple reporters, response privacy, and unauthorized requests.
- Human validation: reviewed and adjusted the implementation and executed TypeScript, ESLint, whitespace checks, and PostgreSQL integration tests. All 65 database tests passed across five test files.
- Assisted with diagnosing a database CI failure caused by parallel test execution and updating the GitHub Actions database test command to use --no-file-parallelism, consistent with the approach used during Slice #5.

### Commit `feat(incidents): add audited incident comments API and tests`

#### Jonathan's Agent

- Assisted with implementing EP-11, including the comment creation endpoint, Zod request validation, role-based authorization, and transactional audit logging.
- Assisted with developing integration tests for authenticated and unauthenticated requests, reporter restrictions, reviewer and administrator permissions, incident visibility, invalid inputs, database persistence, and audit events.
- Human verification included reviewing the implementation, executing the database integration suite (73 tests passed), running TypeScript and ESLint checks, and verifying Git diff formatting.

### Commit `feat(incidents): add audited status transitions API and tests`

#### Jonathan's Agent

- Assisted with implementing EP-10, including reviewer-only status transitions, strict Zod request validation, conditional database updates, and transactional audit logging.
- Assisted with developing integration tests for valid and invalid transitions, authentication, role-based authorization, nonexistent incidents, malformed requests, concurrent updates, and audit record verification.
- Assisted with identifying and correcting inconsistent endpoint labels and resolving test authentication rate-limit failures through reusable reviewer and administrator sessions.
- Human verification included reviewing the implementation, running the database integration suite (84 tests passed), executing TypeScript and ESLint checks, and confirming clean Git diff formatting.

### Commit `feat(incidents): add reviewer category classification endpoint`

#### Jonathan's Agent

- Assisted with implementing EP-21, including reviewer-only category classification, strict Zod request validation, active-category verification, incident visibility restrictions, conditional database updates, and transactional audit logging.
- Assisted with developing integration tests for successful classification, inactive and nonexistent categories, closed incidents, authentication, role-based authorization, malformed identifiers, nonexistent incidents, unexpected request fields, database persistence, and audit verification.
- Assisted with resolving a missing TypeScript type import during implementation.
- Human verification included reviewing the implementation, executing the database integration suite (94 tests passed), running TypeScript and ESLint checks, and confirming clean Git diff formatting.

### Commit `feat(categories): add administrator category management`

#### Jonathan's Agent

- Assisted with implementing EP-22, including administrator-only category listing and creation, strict Zod request validation, category name normalization, length restrictions, case-insensitive uniqueness enforcement, and transactional audit logging.
- Assisted with implementing Prisma duplicate-name error handling to return HTTP 409 Conflict and developing integration tests for successful creation, active and inactive category listing, duplicate names, invalid inputs, unexpected fields, authentication, role-based authorization, database persistence, and audit verification.
- Assisted with validating category name boundaries, including whitespace trimming, rejection of names exceeding 100 characters, and acceptance of names exactly 100 characters long.
- Human verification included reviewing the implementation, incrementally executing the database integration suite (105 tests passed), and verifying endpoint behavior. TypeScript, ESLint, and Git diff checks were also used throughout development.

### Commit `feat(categories): add administrator category updates`

#### Jonathan's Agent

- **AI assistance:** Assisted with implementing EP-23, including administrator-only category updates, request validation, duplicate-name conflict handling, and transactional audit logging.
- **Security considerations:** Reviewed role-based authorization, strict input validation, mass-assignment prevention, and preservation of existing incident-category relationships when categories are deactivated.
- **Testing assistance:** Helped develop integration tests covering category renaming, deactivation/reactivation, duplicate names, unauthorized access, nonexistent categories, empty requests, unexpected fields, and audit behavior.
- **Human verification:** Reviewed the implementation, executed integration tests (115/115 passing), and verified TypeScript compilation, ESLint, and Git whitespace checks.

### Commit `feat(admin): add category management UI`

#### Jonathan's Agent

- **AI assistance:** Assisted with implementing the administrator category-management interface using Next.js server and client components.
- **Implementation:** Added category listing, creation, renaming, activation, and deactivation controls using existing EP-22 and EP-23 endpoints.
- **Security considerations:** Preserved server-side administrator authorization, backend validation, duplicate-name handling, and audited category modifications.
- **Human verification:** Manually tested category creation, duplicate rejection, renaming, deactivation, reactivation, and reviewer category availability. Verified `category.create` and `category.update` records in PostgreSQL.
- **Validation:** TypeScript and ESLint checks completed successfully.

### Commit Claim Slice #5 — Audit View and Settings
### Jonathan's Agent
- Assisted with local development environment setup using WSL2, Node.js 24, Docker Compose, PostgreSQL, and Prisma.
- Helped troubleshoot Windows/WSL dependency conflicts and GitHub CLI authentication.
- Reviewed the delivery-plan workflow and recommended claiming Slice #5 through an early draft pull request.
- Human direction: the developer selected Slice #5 and established a working local environment before beginning implementation. No application functionality or security testing is claimed as completed.

### Commit feat(admin): add read-only audit history API with filtering and tests
#### Jonathan's Agent
- Assisted with implementing the admin-only `GET /api/admin/audit` endpoint, including action filtering, date-range filtering, pagination, and strict query validation.
- Helped diagnose and resolve a Prisma `BigInt` JSON serialization error encountered during manual API testing.
- Guided manual security testing of authentication (401), authorization (403), unsupported HTTP methods (405), invalid parameters, filtering, and pagination.
- Assisted with creating Vitest unit tests and PostgreSQL-backed integration tests for audit retrieval, ordering, pagination, and date boundaries.
- Helped verify that direct audit-log writes are centralized in `src/lib/audit.ts`, preserving the existing transactional audit mechanism.
- Human validation: reviewed the implementation, executed browser-based API tests, ran automated tests and ESLint, and verified the changes before committing. The database-backed suite passed 50 tests, and the non-database suite passed 83 tests with 50 skipped.

### Commit feat(admin): add validated settings API with transactional audit logging
#### Jonathan's Agent
- Assisted with implementing the admin-only `GET` and `PATCH /api/admin/settings` endpoints, including input validation, bounded configuration values, and partial updates.
- Helped implement Serializable transactions to ensure settings changes and their corresponding audit records are committed together.
- Assisted with creating Vitest validation tests and PostgreSQL-backed integration tests covering settings persistence, audit recording, unchanged settings, partial updates, and transaction rollback.
- Reviewed the audit logging implementation and identified a potential bypass introduced by an optional audit writer parameter. Human direction: removed the parameter to ensure production settings updates always invoke `recordAudit()`.
- Human validation: reviewed the implementation, ran TypeScript checks and ESLint, and executed the database integration suite. All 54 database tests passed across 6 files.
- Testing limitation: transaction rollback was verified, but a real audit insertion failure through `updateAdminSettings()` was not directly simulated.

### Commit `feat(admin): add admin settings API with validation, audit logging, and tests`
#### Jonathan's Agent
- Assisted with implementing the admin-only `GET /api/admin/settings` and `PATCH /api/admin/settings` endpoints, including request validation, role-based authorization, and settings persistence.
- Helped implement transactional settings updates with audit records containing the previous and new values, while avoiding unnecessary writes when settings remain unchanged.
- Assisted with creating Vitest validation tests and PostgreSQL-backed integration tests covering settings persistence, partial updates, audit logging, and transaction rollback.
- Guided additional endpoint authorization testing to verify `401` responses for unauthenticated requests and `403` responses for unauthorized roles, including checks that rejected requests do not modify settings.
- Helped investigate an intermittent authentication lockout test failure and improve test fixture isolation to prevent shared settings values from affecting other database tests.
- Human validation: reviewed the implementation, adjusted test fixtures, and executed database integration tests. The latest database-backed run passed all 56 tests across six test files. Final TypeScript, ESLint, and Git checks all passed.

### Commit `feat(admin): add audit history and settings interfaces`
#### Jonathan's Agent

- Assisted with implementing the admin-only Application Settings interface, including editable configuration fields, input validation, change detection, and integration with the existing settings API.
- Helped develop the read-only Audit History interface with action filtering, date-range filtering, pagination, and display of permitted settings changes without exposing incident descriptions or secrets.
- Assisted with integrating both administrative pages into the application's existing navigation and role-based page authorization.
- Helped troubleshoot frontend development issues, including TypeScript import resolution, React effect handling, ESLint warnings, Docker build failures, and changes not appearing in the deployed application.
- Guided browser-based functional testing of settings persistence, audit record display, action and date filters, invalid date-range handling, and administrative navigation.
- Guided authorization testing using a non-administrator account, confirming that direct access to administrative pages returned 404 responses and administrative API requests were rejected with forbidden responses.
- Human validation: reviewed and adjusted the generated code, verified the interfaces in the browser, rebuilt and restarted the Docker application, and executed TypeScript, ESLint, and PostgreSQL-backed integration tests. All 56 database tests passed across six test files. Final formatting and Git checks were performed before committing.

### Commit `docs: update Slice 5 security evidence and align settings validation`
#### Jonathan's Agent
- Assisted with reviewing and updating Slice #5 documentation in `docs/asvs/assignment-mapping.md` and `docs/sdl.md`, including implementation evidence, verification status, and remaining security testing.
- Helped identify and correct a mismatch between the `lockoutMinutes` minimum in `settings-schemas.ts` and the centralized `LIMITS` configuration.
- Human validation: reviewed the documentation changes, confirmed the settings validation bounds, ran TypeScript, ESLint, and PostgreSQL-backed tests (56 passed), and verified the Git diff before committing.

### Commit `docs: claim slice 6 and update threat model for live host (AR-9)`
#### Liam's Agent
- Surveyed open PRs and `docs/plan.md`, proposed Slice 6 scope, and drafted the T-06, T-51, T-52, T-63 and AR-5/AR-8 updates plus new AR-9 in `docs/stride.md`, `docs/threat-model.md`, `docs/sdl.md` and `docs/plan.md`.
- Human decisions: chose AWS EC2 with SSM (no SSH) and Liam as dotenvx key holder. AR-9 is marked pending approval, not approved, because the agent can't approve risk on the team's behalf.

### Commit `feat(deploy): add live-up script, make target, and deployment runbook`
#### Liam's Agent
- Drafted `scripts/live-up.sh`, the `make live-up` target and `docs/deployment.md` (EC2 + SSM + Secrets Manager runbook, verification table).
- Human/security changes: the first plaintext-`.env` check misbehaved in an ad hoc shell test (the regex was right; the zsh test harness was misleading), so it was re-tested with the exact `sh` form against encrypted and plaintext fixtures before keeping it. The runbook's Results table is deliberately empty: nothing has run on AWS yet.

### Commit `docs: clarify host address and key steps in deployment runbook`
#### Liam's Agent
- Rewrote runbook section 1 into 1a (Elastic IP, sslip.io hostname, `SITE_ADDRESS`) and 1b (encrypt, check, store key), and added the `associate-address` command to section 2.
- Human change: the original step 1 was too terse for the person running it; rewritten after they asked what "pick the host address" meant. Commands are unrun; no AWS access used.

### Commit `feat(deploy): add dotenvx-encrypted live env (SR-14)`
#### Liam's Agent
- Walked the developer through generating and encrypting `.env` with dotenvx and storing the private key in AWS Secrets Manager. The agent never read `.env.keys` or decrypted values; permissions blocked it from reading `.env`.
- Human/security checks: the developer ran a masked check confirming every value is `encrypted:` ciphertext, chose the Local key store, stored the key in Secrets Manager, and committed only `.env` (`.env.keys` is gitignored).

### Commit `feat(deploy): add AWS provisioning script for the live host`
#### Liam's Agent
- Drafted `scripts/aws-provision.sh` (security group 80/443, IAM role scoped to one secret, IMDSv2 hop limit 1, encrypted gp3, no key pair, Elastic IP attach) and runbook sections 2a/2b.
- Human/security changes: the script is not run by CI or the agent and asks for confirmation; the developer reviews it first. Docker Compose, buildx and Node 24 on Amazon Linux 2023 are deliberately left as manual, checked steps because the agent could not verify package availability. Not run against AWS.

### Commit `docs: record verified host setup steps in deployment runbook`
#### Liam's Agent
- Guided the developer through checking Amazon Linux 2023 for Compose and Node, and recorded the working commands in runbook section 2b.
- Human/security changes: the developer chose the Compose version and ran the checksum verification (`sha256sum -c` printed OK); the agent did not guess versions. Docker-group access for `ssm-user` is root-equivalent and is accepted under AR-1.

### Commit `docs: record live deployment and first verification results`
#### Liam's Agent
- Recorded the buildx upgrade step and the first live results (redirect, trusted certificate, security headers) in `docs/deployment.md`; ran the read-only `curl -I` checks against the live host.
- Human/security changes: the developer ran the deployment on the host and chose and checksum-verified the buildx version. The agent reported only what was observed; port scan, TLS version scan and role checks are marked not run.

### Commit `docs: add redeploy section and README note on the committed .env`
#### Liam's Agent
- Added runbook section 6 (redeploy from `main`: what must still exist, per-situation steps) and renumbered teardown to 7; rewrote the README "Team secrets" note.
- Human/security changes: the README note warns that a plain `make up` now defaults to the live `.env`, which needs the key and targets the live hostname, so local work stays on `ENV_FILE=.env.local`. The redeploy steps are unrun.

### Commit `fix(deploy): fail closed without the dotenvx key; add live-run wrapper`
#### Liam's Agent
- Diagnosed a failed `make create-admin` on the live host: the key was only exported inside `live-up.sh`, so dotenvx passed ciphertext through, recreated the db container with ciphertext env, and the CLI failed with `Invalid URL`. Added `--strict` to every `dotenvx run` in the Makefile and `scripts/live-run.sh` to supply the key for one-off commands; updated runbook section 3.
- Human/security changes: tested `--strict` (exit 1 without the key, exit 0 with a plaintext `.env.local`). Fixing the runbook, which had told the operator to run `make create-admin` without the key.

### Commit `docs: record outside port and TLS spot checks for the live host`
#### Liam's Agent
- Ran read-only `nc` and `openssl s_client` checks against the live host and recorded them in the runbook Results table.
- Human/security changes: the first TLS 1.1 attempt failed inside the local client (`no protocols available`) and was not counted as a server result; it was retried with a lowered client security level, which showed the server's `protocol version` alert. The table says these are spot checks, not full `nmap`/`ssl-enum-ciphers` scans.

### Commit `docs: use the app's role name "user" instead of "reporter"`
#### Liam's Agent
- Replaced "reporter" with "user" where it names a role in `docs/deployment.md` and `docs/plan.md`, after the developer found no "reporter" role in the admin screen. The schema roles are `user`, `reviewer`, `admin` (FR-2, SR-4).
- Human/security changes: limited to role-name uses. "Reporter" as a plain word or as the `reporter_id` column in the design, threat-model, STRIDE and use/misuse documents was left as is.

### Commit `docs: record post-merge integration and security verification evidence`
#### Jonathan's Agent

- Assisted with post-merge integration verification of Slices #4 and #5 (PRs #54 and #53), including rebuilding the Docker application and verifying role-based navigation and functionality.
- Guided manual testing of the complete incident lifecycle, reviewer classification, comment creation, status transitions, administrator visibility, and corresponding audit records.
- Assisted with security verification of stored XSS rendering, unauthorized page access, input validation feedback, and consistent authentication error messages.
- Guided PostgreSQL verification of append-only audit enforcement, including database privilege inspection, rejected UPDATE and DELETE operations under the effective application database role, and independent trigger enforcement against UPDATE, DELETE, and TRUNCATE operations.
- Assisted with targeted sensitive-data exposure checks in application logs and audit records, and reviewed existing automated tests for transactional audit integrity and rollback behavior.
- Assisted with reconciling GitHub issues #7, #8, #9, and #10 against implementation and verification evidence.
- Assisted with updating `docs/asvs/assignment-mapping.md` and `docs/sdl.md` to record verified requirements, supporting evidence, partial verification results, and remaining security testing activities without overstating requirement coverage.
- Human validation: manually executed browser-based integration and security tests, PostgreSQL queries, and application-log checks; reviewed automated test results and GitHub CI/security checks; reviewed and adjusted documentation changes and verified the Git diff before committing.

### Commit `feat(logging): log denied access as access.denied (SR-16, V16.3.2)`
#### Liam's Agent
- Added an `access.denied` warning log for 403 and 404 API responses in `route()` (with request ID, route, method, status), the caller's `userId` where `authenticate` knows it, and a page-level log for wrong-role 404s; unit tests in `tests/http.test.ts` and a database test in `tests/db/admin-users.test.ts`; marked ASVS V16.3.2 Done with evidence.
- Human/security changes: stayed inside the logger's field allowlist (no role, path, body or cookie), kept denials out of the append-only audit table (FR-12), and added assertions that neither the cookie value nor the attempted username appears in the log. `make test-db` (125 tests) and lint, type check, unit tests and guards passed locally. The page-level log (`requirePageUser`) has no automated test because it needs the Next.js request runtime.

### Commit `docs: use "user" for the role across design, threat-model and test docs`
#### Liam's Agent
- Replaced "reporter" with "user" wherever it names the role (FR-2, SR-4) in `docs/design.md`, `docs/threat-model.md`, `docs/use-misuse-cases.md`, `docs/sdl.md` and `docs/asvs/assignment-mapping.md`; "its reporter" (the incident's owner) became "its owner".
- Human/security changes: the developer set the rule (change it only where it means the role). The `reporter_id` column, "reporter reference" in the data table and the STRIDE/threat-model `reporter_id` mentions were left unchanged so they still match the schema. Also merged `main` into the branch and kept both sides' entries in this file.

### Commit `docs: warn that grader temporary passwords expire`
#### Liam's Agent
- Read `LIMITS`, the Prisma default and `app/api/auth/login/route.ts` to confirm that temporary passwords expire (default 24 h, maximum 72 h) and are refused at login after expiry; added the warning and the grader-account result to `docs/deployment.md`.
- Human/security changes: the developer created the accounts and chose to leave them on temporary passwords for the instructor; the agent recommended resetting them shortly before submission. No credentials were seen by the agent.

### Commit `docs: record grader accounts with final passwords`
#### Liam's Agent
- Updated the runbook Results row: the developer logged in to each grader account and replaced its temporary password, so the 24 to 72 hour expiry no longer applies.
- Human/security changes: the developer chose to set the final passwords themselves after the agent explained the expiry. No credentials were seen by the agent.

### Commit `docs: add the category setup step to the deployment runbook`
#### Liam's Agent
- Found that categories are created at `/admin/categories` and that a fresh live database has none, and added the step to runbook section 4.
- Human/security changes: categories are created by the admin on the live site, not seeded, to keep T-63 (no seed data in the deployed start path).

### Commit `docs: correct audit expectations in the live verification table`
#### Liam's Agent
- Told the developer to look for login and denied-access entries in the audit view; that was wrong, because FR-11 and `AUDIT_ACTIONS` do not include them. After the developer's screenshot, read `src/lib/audit.ts` and the login route, corrected the runbook row and recorded the result.
- Human/security changes: the developer ran the role checks and caught the discrepancy. ASVS V16.3.2 (log failed authorization) is flagged as not found in the code and left for the team to decide.

### Commit `docs: record approval of AR-9 (live grading host)`
#### Liam's Agent
- Changed AR-9 from pending to approved in `docs/stride.md`, `docs/threat-model.md` and `docs/sdl.md`, dated 2026-11-24.
- Human/security changes: the developer made the approval decision; the agent only recorded it and did not approve it. Team member names stay out of the record (team number only).

### Commit `docs: add demo script and record host checks`
#### Liam's Agent
- Added a per-role demo script with misuse scenes to `docs/deployment.md` and recorded the two host checks (no `.env.keys`, no `DOTENV_PRIVATE_KEY` in image history) in the Results table.
- Human/security changes: the developer ran the host checks. The agent's first draft of demo step 4 claimed the admin incident view has no status control without checking; it was verified in `app/` (only the reviewer page uses `StatusControls`; the status API allows reviewers only) and reworded. Audit tampering (T-33) is deliberately not shown live and points to `tests/db/audit.test.ts`.

### Commit `docs: record the full TCP scan of the live host`
#### Liam's Agent
- Recorded the developer's `nmap -p-` result (only 80 and 443 open) in the runbook Results table.
- Human/security changes: the agent noticed that most ports reported "closed (connection refused)" and a 2 ms latency, which an AWS security group would not produce, and recorded that caveat instead of presenting the scan as clean evidence of the security group.

### Commit `docs: update tracking docs and correct the scan caveat`
#### Liam's Agent
- Set ASVS V12.2.1, V13.3.1 and SR-14 to Done with evidence, V12.1.1, V13.3.2 and SR-16 to In progress, and slice 6 to In review (`docs/asvs/*`, `docs/plan.md`).
- Human/security changes: the developer ran the scan, then corrected the agent's guess that a corporate network caused the odd results (it was a personal laptop off VPN). The caveat now says the cause is unknown instead of asserting one. SR-16 and V12.1.1 were deliberately not marked Done because SAST/DAST (#56) and the full cipher scan are outstanding.

### Commit `docs: record TLS evidence and refresh the runbook status`
#### Liam's Agent
- Recorded the developer's `nmap ssl-enum-ciphers` result and the agent's direct TLS 1.2 and 1.3 handshakes in `docs/deployment.md`; set ASVS V12.1.1 to Done; refreshed the stale runbook status line.
- Human/security changes: nmap listed only TLS 1.3, which conflicted with an earlier note that TLS 1.2 is accepted. The agent re-tested directly (TLS 1.2 handshake and a TLS 1.2-only `curl` succeeded) and recorded nmap's list as incomplete rather than changing the finding. An earlier `openssl` line (`Protocol: TLSv1.1`) printed even for refused handshakes, so refusals are judged by the `protocol version` alert, not that line.

### Commit `docs: record port sweep and add update-in-place steps`
#### Liam's Agent
- Recorded a second-machine port sweep (only 80 and 443 open) and added an "update the running host" section to `docs/deployment.md` for deploying `main` after PRs #57 and #59 merge.
- Human/security changes: the developer chose to deploy `main` after both PRs merge. The sweep is labelled as not a full 65,535-port scan, and the section tells the operator to verify denial logging after deploy. The update steps are unrun.

### Commit `Merge main into fix/log-authz-denials`
#### Liam's Agent
- Resolved the `AI-USAGE-REPORT.md` conflict by keeping both sides' entries, fixed missing blank lines between entries, and replaced a stale "PR #59" reference in the SR-16 row with the evidence paths now that #57 is merged.
- Human/security changes: none to the code. Lint, type check, unit tests (90) and the CI guards pass on the merged tree; database tests were run before the merge and are re-run by CI.

### Commit `docs: record live verification of main and mark slice 6 done`
#### Liam's Agent
- Recorded the redeploy of `main` and the live denial-logging check in `docs/deployment.md`, marked ASVS V16.3.2 verified on the live host and slice 6 Done in `docs/plan.md`, and replaced an out-of-date "create the first admin" message at the end of `scripts/live-up.sh`.
- Human/security changes: the developer ran the redeploy and the denial test on the instance and pasted the log lines; the agent confirmed they carry a user ID and request ID and no cookie, password or incident text before recording the result.

### Commit `docs: reconcile OWASP Security by Design principles with implementation`
#### Jonathan's Agent

- Assisted with reviewing and updating all ten OWASP Security by Design principles in `docs/owasp-design-principles.md` to reflect the delivered application rather than planned implementation.
- Helped reconcile each principle with implemented security controls, relevant assignment requirements, threat mitigations, and supporting code and test evidence.
- Assisted with incorporating evidence from Slices #4 and #5, including server-side RBAC, input validation, transactional audit logging, append-only database protections, and manual security verification.
- Helped incorporate subsequent security remediation and deployment evidence, including object-level authorization corrections, bounded pagination, identifier validation, atomic temporary-password consumption, and consistent error handling.
- Assisted with distinguishing implemented and verified security controls from remaining verification activities and known limitations to avoid overstating security compliance.
- Human validation: reviewed and adjusted the documentation, reconciled explanations with the application's implementation and previously collected verification evidence, and executed TypeScript, ESLint, and PostgreSQL-backed integration tests against the latest integrated application. All 125 database-backed integration tests passed.
### Commit `docs: claim local integration fixes (SR-4, SR-7, SR-16)`
#### Team #13's Agent
- Claimed remediation of the eight local integration findings on a branch from main; checked open PRs to keep fixes separate from SAST/DAST (#56) and release documentation (#55).
- Human/security changes: the developer requested a new branch from main and fixes for the reported findings. No application changes or security acceptance claims in this commit.

### Commit `fix: close integration gaps (SR-4, SR-7, SR-16; ASVS V8.2.2)`
#### Team #13's Agent
- Implemented bounded incident pagination and navigation, summary-only user access, safe UUID paths, closed-incident privacy, explicit API method errors, and edge rejection security headers. Added a migration and transactional single-use temporary credentials, including concurrent-login and stale-hash protection; updated reset/change flows.
- Added unit and database regressions; corrected two old tests that permitted user detail access against R-14, and an old fixture that reused a temporary password to create two sessions. Updated the design, entry point inventory, ASVS evidence, SDL progress and plan.
- Human/security changes: the developer requested the fixes on a new branch from main. No human code edits have been reported. Security refinements during implementation keep role checks inside handlers, scope paging in the database, preserve generic errors and sensitive-log exclusions, and require an admin reset if a consumed initial session is lost. Existing untracked security scripts were left untouched. No live deployment or release approval is claimed.
- Validation: lint, TypeScript, guards, 104 unit tests, 131 database tests, Docker production build, production audit (0 vulnerabilities), local HTTPS rechecks, and Admin/User/Reviewer browser pagination. Native `make check` fails at Turbopack worker port binding on this host, including elevated retry; no application build error was observed in Docker. Corrected a temporary live-test harness assumption: an unchanged settings save is intentionally unaudited; a unique real change was audited successfully.
### Commit docs: resolve PR 55 review and integrate main (NFR-8, NFR-9, SR-14)
#### Alex's Agent
- Merged current main into the user-manual/source-packaging branch, preserving both sides of the AI usage history, live deployment targets, encrypted-env guidance, and current delivery/SDL evidence.
- Replaced pending workflow text with current role-specific screen instructions; added mandatory initial category setup, live deployment guidance, and moved the deployment demo script into the manual. Expanded the component inventory for incidents, categories, audit/settings, and deployment scripts.
- Human direction: address PR #55 review comments. No subsequent human edits at authoring time. AI review corrected the draft's reporter-detail promise, comment limit (2,000), reviewer-only status/classification, and local/live secret distinction to match the integrated implementation. Submission identity sanitization remains a documented release task, including the clone URL; no historical provenance was removed.
- Validation: documentation file links, shell syntax, Make target discovery, and whitespace checks passed. Database checks passed all 125 tests and image hardening checks passed after integration. Lint, 90 unit tests, and CI guards passed; the native macOS build remained blocked by a Turbopack worker port permission error, while the Docker production build passed. Dependency audit, committed-source export and fresh CI results will be recorded on the PR. No new browser/live session, clean-OS installation, or final release certification is claimed.

### Commit test: restart local slice 7 verification (SR-16, NFR-3–6)
#### Team #13's Agent
- Started a fresh local verification branch from current main at the developer's direction, independently of PR #56. Planned isolated synthetic-data SAST, DAST, load and recovery runs.
- Human/security changes: developer explicitly requested restarting Slice 7 using the local build. Existing untracked security scripts and the existing local database are preserved. No results are claimed in this planning commit.

### Commit test: add isolated local verification and safe form fallbacks (SR-16, NFR-3–6)
#### Team #13's Agent
- Produced a separate production-build Compose project, synthetic fixtures, local Semgrep/ZAP runners, HTTP permission/input probes, k6 load scripts, and a fresh-database encrypted backup/restore and outage drill. Existing untracked `scripts/security/` work was not reused or changed.
- Corrected a DAST finding: native HTML form fallback defaulted to GET; six forms now explicitly POST to keep credentials and report content out of URLs (ASVS V14.2.1).
- Human/security changes: the developer requested a complete local restart of Slice 7. No human code edits have been reported. The agent corrected fixture typing and TLS SNI in the harness. A shared-IP diagnostic load run hit the existing login limit; the baseline uses 50 actual source IPs without weakening application rate limits or trusting spoofed forwarding headers. Raw credentials/reports/backups remain in a private temporary directory, and restore targets a new database only.
- Results are recorded in `docs/evidence/slice7/`; no live deployment or final release acceptance is claimed.

### Commit fix: retry adapter transaction conflicts found under load (NFR-5, NFR-6)
#### Team #13's Agent
- Investigated six `DriverAdapterError: TransactionWriteConflict` login failures in the first complete 50-source-IP load run. The existing helper recognized only Prisma P2034. Extended the same bounded whole-transaction retry to the adapter's structured conflict kind; unrelated errors still propagate and exhaustion returns a generic 409.
- Added six regression cases for both conflict forms, successful retry, bounded exhaustion, null/unrelated errors and message-only lookalikes. Local lint, TypeScript and all 110 unit tests passed before the repeat production load run.
- Corrected scanner findings in the test harness by trusting the isolated Caddy CA instead of using unverified Python TLS contexts. Added richer HTTP coverage and retained pre-fix load evidence. No human edits reported; no security control or rate limit was weakened.

### Commit docs: record local slice 7 results and limitations (SR-16, NFR-3–6)
#### Team #13's Agent
- Recorded sanitized SAST/ZAP, 151 HTTP checks, load, integrity, encrypted restore/outage, log-sentinel and entry-point evidence; updated plan, SDL and only the ASVS/assignment rows supported by code and executed checks. Added rejection checks for missing/null origins and form encoding, and exercised audit pagination over 25 records. Removed the one-off orchestration helper after its run.
- Final application load on `f53b465`: 7,960 actions, zero errors, p95 read/write/login 12.91/16.52/75.20 ms. Restore fingerprints matched; recovery took 6.41 seconds. Local 110 unit/131 DB tests passed; Semgrep reported zero findings/errors. Scanner warnings and remaining coverage are explicitly documented.
- Human/security changes: no human code edits reported. The agent edited the shell load wrapper while it was still executing, which caused a trailing parse error after k6 finished and saved complete passing metrics. This caveat is retained; the corrected wrapper uses `exec docker run` and passes syntax checks. The benchmark is not represented as a clean wrapper exit. Credentials, raw reports and backups remain private, and the existing local stack/untracked security scripts are preserved. No live deployment, final security acceptance, or new residual-risk approval is claimed.

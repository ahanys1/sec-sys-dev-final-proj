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

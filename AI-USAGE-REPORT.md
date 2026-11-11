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

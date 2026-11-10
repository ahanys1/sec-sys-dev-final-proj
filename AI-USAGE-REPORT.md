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

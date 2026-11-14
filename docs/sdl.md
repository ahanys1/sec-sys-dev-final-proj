# SDL / Secure Software Systems Life Cycle Adherence

Team #__

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#9-acceptance-criteria) (AC-4: the final report must document SDL adherence and AI usage)

**Model:** Microsoft Security Development Lifecycle (SDL): 17 practices in 7 phases (CS 5343 Lesson 04; Microsoft *SDL Progress Report*).

**How to use this file:** it is the project's SDL tracker during development and becomes the AC-4 deliverable at the end. When work moves a practice forward, update its row in the same commit, as with the ASVS checklist. A practice is `Done` only with evidence (file, PR, or test name).

Status values: `Done` · `In review` (PR open) · `In progress` · `Next` · `TODO` · `N/A: reason`

## Current phase

**Design** (as of 2026-11-14). #6 is done; #7 Threat Modeling is in review. #8 (tooling) has started in parallel; feature code waits until #7 covers that area (see [threat-model.md](threat-model.md) Part 2).

## Practice tracker

| # | Phase | Practice | What it means for this project | Status | Evidence |
|---|---|---|---|---|---|
| 1 | Training | Provide Training | Team: CS 5343 lessons on secure design, threat modeling, ASVS, AI-assisted coding. AI tools are "trained" too: every agent reads the security rules before writing code. | Done | Course Lessons 01 to 21; `AGENTS.md`; `.github/copilot-instructions.md` |
| 2 | Requirements | Security Requirements | SR-1 to SR-16, plus OWASP ASVS 5.0.0 Level 2 as the target, mapped to the assignment requirements. | Done | `ASSIGNMENT.md` §5; `docs/asvs/assignment-mapping.md`; `docs/asvs/owasp-top10-mapping.md` |
| 3 | Requirements | Quality Gates / Bug Bars | Minimum release threshold and which defects block release. | TODO: team to confirm [proposal below](#quality-gates-and-bug-bar-practice-3) | |
| 4 | Requirements | Security and Privacy Risk Assessment | Answer the Lesson 04 SRA/PRA questions; data sensitivity levels. | In progress: team to confirm [draft below](#security-and-privacy-risk-assessment-practice-4) | `ASSIGNMENT.md` §6.2 |
| 5 | Design | Design Requirements | Design doc showing how every FR/NFR/SR is met, with a Requirements Traceability Matrix (RTM). Must include the decisions from threat-model §1.1 and the D-2 additions (settings, categories). | TODO | `docs/design.md` (stub); architecture decisions in `docs/threat-model.md` §1.1 |
| 6 | Design | Attack Surface Reduction | Entry point inventory, trust boundaries, reduction decisions. | Done | `docs/threat-model.md` Part 1 (merged, PR #24) |
| 7 | Design | Threat Modeling | DFD, STRIDE per element, DREAD ranking, mitigations, misuse cases. Also resolves D-4 (SR-14 secrets) and D-5 (session policy). | In review: misuse cases and tests are with another engineer | `docs/threat-model.md` Part 2; `docs/stride.md`; D-4 and D-5 resolved; `docs/use-misuse-cases.md` pending |
| 8 | Implementation | Use Approved Tools | Fixed, version-pinned tool list. | In progress | [Approved tools below](#approved-tools-practice-8); scaffold on `feature/nextjs-scaffold` |
| 9 | Implementation | Deprecate Unsafe Functions | Banned APIs for TypeScript/Next.js, enforced by lint and CI. | TODO: team to confirm [proposal below](#banned-functions-practice-9) | |
| 10 | Implementation | Static Analysis | SAST in CI on every PR (AC-3). | TODO: pick tool | `docs/security-testing.md` |
| 11 | Verification | Dynamic Program Analysis | DAST against the running Docker app over TLS (AC-3; D-7). | TODO: pick tool | `docs/security-testing.md` |
| 12 | Verification | Fuzz Testing | Fuzz the inputs in scope from #4 question 5. | TODO | `docs/security-testing.md` |
| 13 | Verification | Threat Model and Attack Surface Review | Compare built routes and pages with the threat-model §1.4 inventory; update STRIDE for any change. | TODO | `docs/threat-model.md` revision history |
| 14 | Release | Incident Response Plan | Short plan for a vulnerability or breach in this app. | TODO | [Outline below](#incident-response-plan-practice-14) |
| 15 | Release | Final Security Review | Team-internal review against the #3 gates before submission. | TODO | [Checklist below](#final-security-review-practice-15) |
| 16 | Release | Release / Archive | Tagged release and archived submission. | TODO | [Plan below](#release-and-archive-practice-16) |
| 17 | Response | Execute the Incident Response Plan | Only if an incident happens after release. | N/A: no production release in the course. Applies if the app is deployed to AWS later. | |

## Deliverables mapped to SDL practices

| Submission item (ASSIGNMENT.md) | Practice(s) | File |
|---|---|---|
| Cover page | n/a | `docs/cover-page.md` |
| Design document | #5 | `docs/design.md` |
| STRIDE analysis | #7 | `docs/stride.md` |
| Threat model and attack surface analysis | #6, #7, #13 | `docs/threat-model.md` |
| Use and misuse cases | #7, #11 | `docs/use-misuse-cases.md` |
| SAST and DAST explanation | #10, #11, #12 | `docs/security-testing.md` |
| OWASP Security by Design principles | #5, #7 | `docs/owasp-design-principles.md` |
| AI usage report | all | `AI-USAGE-REPORT.md` |
| Code with in-line documentation | #8, #9, #10 | `app/`, `src/` |
| User manual | #16 | `docs/user-manual.md` |
| Demo video (use and misuse) | #11, #15 | link in the final report |
| SDL adherence (AC-4) | all | this file |

## Suggested schedule (due 2026-11-25)

| Dates | Phase | Practices |
|---|---|---|
| Nov 10 to 13 | Requirements / Design wrap-up | #3, #4 confirmed; #5 design doc; #6 merged; #7 high-risk STRIDE |
| Nov 12 to 20 | Implementation | #8, #9, #10, area by area once #7 covers it; finish #7 for lower-risk items |
| Nov 18 to 22 | Verification | #11, #12, #13 |
| Nov 22 to 25 | Release | #14, #15, #16; video; final report |

---

## Quality gates and bug bar (Practice #3)

**Proposed; team to confirm.**

**Release gate.** All must be true before submission:

1. Every row in `docs/asvs/assignment-mapping.md` is `Done` with evidence (AC-1, AC-2).
2. No open High or Critical findings from SAST, DAST, or manual testing (AC-3).
3. `npm audit` reports no High or Critical vulnerabilities in production dependencies.
4. Lint, type check, and tests pass in CI on `main`.
5. Every threat at or above the bug bar is mitigated and has a passing test.
6. Every AI-assisted change is in `AI-USAGE-REPORT.md` (AC-4).

**Bug bar.** Rate threats and findings with DREAD (average of the five 1 to 10 scores):

| DREAD average | Severity | Rule |
|---|---|---|
| 7.0 to 10 | High | Must be fixed and tested before release |
| 4.0 to 6.9 | Medium | Fix before release, or document an accepted risk with a reason |
| below 4.0 | Low | Fix if time allows; record it |

Regardless of score, any authentication bypass, privilege escalation (SR-4 to SR-6), SQL injection (SR-8), or audit log tampering (FR-12, SR-11) is High.

## Security and privacy risk assessment (Practice #4)

**Draft; team to confirm.** Answers to the Lesson 04 questions:

1. **Which portions need threat models before release?** All entry points in `docs/threat-model.md` §1.4, prioritizing the high-risk ones in §1.9 (login, password change, admin user and settings changes, incident access).
2. **Which portions need security design reviews?** Authentication and sessions, RBAC, audit logging, the admin settings page (EP-20), and secrets handling.
3. **External penetration testing?** None; there's no external team in the course. The team's own manual misuse testing stands in for it, shown in the demo video.
4. **Additional testing or analysis?** SAST, DAST, and manual security testing (AC-3); dependency scanning (`npm audit`).
5. **Fuzz testing scope?** JSON bodies and query parameters of every state-changing endpoint, focusing on login (EP-02), password change (EP-06), incident creation (EP-07), comments (EP-11), and admin settings (EP-20).
6. **Privacy Impact Rating:** **P1 (High).** The application stores PII: user accounts, and incident reports that may name people. Development and testing use no real personal data (ASSUMP-2), but the rating is about what the product does.

Data sensitivity levels come from `ASSIGNMENT.md` §6.2 and are applied per data store in `docs/threat-model.md` §1.7.

## Approved tools (Practice #8)

| Purpose | Tool | Status |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript, version pinned with a lockfile | Chosen |
| Database | PostgreSQL in Docker | Chosen |
| AI assistance | GitHub Copilot (CONST-3); other agents follow `AGENTS.md` | Chosen |
| Version control | Git + GitHub, feature branches and PRs (CONST-2) | Chosen |
| Password hashing | argon2id (or bcrypt) via a maintained library (SR-2) | Library TODO |
| ORM / query layer | TODO (D-6: Prisma or Drizzle) | TODO |
| Test runner | TODO (the scaffold branch includes a Vitest config) | TODO |
| SAST | TODO (e.g. Semgrep, GitHub CodeQL, eslint security plugins) | TODO |
| DAST / fuzzing | TODO (e.g. OWASP ZAP) | TODO |
| Threat modeling | Mermaid DFDs, STRIDE and DREAD in markdown | Chosen |
| Secrets (SR-14) | dotenvx (encrypted `.env`); AWS Secrets Manager | Chosen |

## Banned functions (Practice #9)

**Proposed; team to confirm.** Enforce with ESLint rules and a CI grep where ESLint can't.

| Banned | Why | Use instead | Req |
|---|---|---|---|
| `eval`, `new Function`, string `setTimeout`/`setInterval` | Dynamic code execution | Plain code | V1.3.2 |
| `dangerouslySetInnerHTML`, `innerHTML` | XSS | React's default escaped rendering | SR-7; V3.2.2 |
| Raw unsafe query APIs (e.g. `$queryRawUnsafe`, string-built SQL) | SQL injection | ORM calls or parameterized queries | SR-8; V1.2.4 |
| `child_process` (`exec`, `spawn`) | Command injection; not needed | None | V1.2.5 |
| `Math.random()` for tokens, IDs, or passwords | Predictable | `crypto.randomBytes`, `crypto.randomUUID` | V11.5.1 |
| MD5, SHA-1, or plain SHA-256 for passwords | Fast hashes are crackable | argon2id or bcrypt | SR-2; V11.4.2 |
| `"use server"` (Server Actions) | Hidden endpoints (threat-model A-5) | Route Handlers | SR-5 |
| `console.log` of request bodies, passwords, tokens, descriptions | Sensitive data in logs | The project logger with field allowlists | SR-9; V16.2.5 |

## Incident response plan (Practice #14)

**Outline; to complete before release.**

- **Reporting:** a `SECURITY.md` in the repo saying how to report a vulnerability, and who on the team receives it.
- **Triage:** rate it with the #3 bug bar.
- **Containment:**
  - End affected sessions: one user through EP-15, or all users with a session-table purge.
  - Deactivate compromised accounts.
  - Rotate database credentials (secrets store, D-4).
- **Investigation:** the audit log (who, what, when, target) and application logs.
- **Recovery:** fix on a branch, run the #3 release gate again, redeploy, and restore the database from backup if data was changed.
- **Lessons learned:** update the threat model and add a test for the issue.

## Final security review (Practice #15)

Before submission, the team checks and records the outcome here (Pass / Pass with exceptions / Fail):

- [ ] Release gate (#3) met
- [ ] Threat model and attack surface reviewed against the built system (#13)
- [ ] SAST, DAST, fuzz, and manual results documented (#10 to #12)
- [ ] All deliverables present; team names only on the cover page
- [ ] AI usage report complete

## Release and archive (Practice #16)

- Tag the submitted commit (e.g. `v1.0.0`) on `main`.
- Archive with the tag: the final report, the SBOM or dependency list (V15.1.2), and the demo video link.
- Record the exact Next.js, Node, and PostgreSQL versions used.

## Revision history

| Date | Change |
|---|---|
| 2026-11-10 | Initial SDL tracker (AI-drafted; see AI-USAGE-REPORT.md). |
| 2026-11-14 | #6 marked Done; #7 in review; secrets and threat modeling tools recorded. |

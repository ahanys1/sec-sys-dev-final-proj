# STRIDE Analysis

Team #__

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#submission-requirements)

SDL mapping: **Practice #7, Threat Modeling.** The data flow diagrams and element IDs (E, P, DS, DF) are in [threat-model.md](threat-model.md) Part 2. Entry points (EP), framework surfaces (FW), non-HTTP surfaces (NH), and controls (C) are in Part 1.

## Method

- STRIDE per element, using the categories that apply to each element type:

  | Element type | S | T | R | I | D | E |
  |---|---|---|---|---|---|---|
  | External entity | ✓ | | ✓ | | | |
  | Process | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
  | Data store | | ✓ | ✓ (audit log) | ✓ | ✓ | |
  | Data flow | | ✓ | | ✓ | ✓ | |

- **DREAD** scores are 1 to 10 for Damage, Reproducibility, Exploitability, Affected users, Discoverability. **Avg** is their mean. Scores are the inherent risk **before** the listed mitigations; they rank the work. They are Claude's judgment and need team review.
- **Severity** follows the bug bar in [sdl.md](sdl.md): 7.0 or more is High (must be mitigated and tested before release), 4.0 to 6.9 Medium (mitigate, or document an accepted risk), below 4.0 Low. `High*` means High regardless of score: authentication bypass, privilege escalation, SQL injection, or audit tampering.
- **Status:** `Mitigated by design` means the control is already in Part 1. `Design change (DC-n)` means this analysis added or tightened a control (listed below and applied to Part 1). `AR-n` is an accepted residual risk (listed below).
- The suggested misuse cases and tests for High threats are in [threat-model.md](threat-model.md) Part 2, Step 4.

## Threats

### A. Authentication and sessions (EP-02, EP-05)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-01 | P3, E1, E2, E3 | S | Credential stuffing or brute force on login takes over an account (an admin account means full control). | EP-02 | Per-account and per-IP rate limit; lockout (§1.4.1); argon2id; 15-char minimum; common-password check (SR-2, SR-3; V6.1.1, V6.3.1, V2.4.1, V6.2.1). | 8·8·7·5·9 | 7.4 | High | Mitigated by design + AR-6 |
| T-02 | P3, P4 | I | Login responses, timing, or lockout messages reveal which usernames exist. | EP-02 | One generic failure message and status; dummy argon2 verify for unknown users; lockout counted by the submitted name even if no such account (V6.3.1, V2.4.1). | 3·9·8·5·8 | 6.6 | Medium | Mitigated by design |
| T-03 | P3, DS1 | D | Attacker repeatedly fails logins for a victim (or the only admin) to lock them out (§1.4.1 note). | EP-02 | Lockout is temporary with fixed bounds (5 to 60 min); per-IP limiter caps one source; lockouts logged; no hard lock (V6.1.1). | 5·9·8·4·7 | 6.6 | Medium | Mitigated by design + AR-2 |
| T-04 | P3, P4 | D | Flood of login requests exhausts CPU through argon2id verification. | EP-02, EP-06 | Rate limit runs before hashing; password max 128 chars; request body cap; bounded hash concurrency (NFR-4; V2.4.1, V6.3.1). | 5·8·7·7·6 | 6.6 | Medium | Mitigated by design |
| T-05 | P4 | S | Session fixation: attacker plants a known token before the victim logs in. | EP-02 | No pre-login session; new random token at login, old one ended (V7.2.4); `__Host-` cookie can't be set by a subdomain. | 7·3·4·3·4 | 4.2 | Medium | Mitigated by design |
| T-06 | P6, DF-1, DF-2 | T,I | Credentials or session tokens intercepted or altered in transit; TLS downgrade or a plain-HTTP hop. | NH-10, TB-1, TB-5 | TLS 1.2+ only; HSTS; `Secure` cookie; HTTP to HTTPS redirect; TLS to the app where the platform allows; local Caddy proxy (D-7) (SR-3; V12.1.1, V12.2.1, V3.3.1). | 9·6·5·7·7 | 6.8 | Medium | Mitigated by design |
| T-07 | DS8 | I | A failed-login log line captures a password typed into the username field. | EP-02, NH-6 | Log the username only if it matches an account, otherwise a short hash; never log request bodies (SR-9; V16.2.5). | 6·7·6·3·4 | 5.2 | Medium | Mitigated by design |
| T-08 | P2, P4 | S | Session token stolen (XSS, network, logs, DB read) and replayed. | EP-05 | HttpOnly, `__Host-`, Secure, SameSite=Strict; token stored hashed; 256-bit CSPRNG; idle and absolute timeouts (D-5); CSP nonce; logout and deactivation delete the row (SR-3; V7.2.1, V3.3.1, V3.3.4, V7.4.1). | 9·5·5·5·6 | 6.0 | Medium | Mitigated by design |
| T-09 | P3 | S | CSRF: a malicious site makes the victim's browser send a state-changing request (Route Handlers have no built-in Origin check). | C-4, EP-05 to EP-23 | SameSite=Strict; same-origin `Origin` required (missing = reject); JSON-only content type; POST/PATCH only (V3.5.1, V3.5.3, V3.3.2). | 7·6·5·7·6 | 6.2 | Medium | Design change (DC-2) |
| T-10 | P4 | S | A session token still works after logout, deactivation, or password reset. | EP-05, EP-15, EP-17 | Session rows deleted server-side; every request re-reads the session and the `active` flag (A-4, A-7; V7.4.1, V7.4.2, V7.4.5). | 5·3·4·3·4 | 3.8 | Low | Mitigated by design |
| T-11 | P4 | T | A forged or guessed session token, or a client-supplied role, is accepted. | A-4, A-7 | 256-bit CSPRNG token looked up by hash; role read from the DB on every request, never from the cookie (V7.2.3, V8.3.1). | 9·2·2·8·3 | 4.8 | Medium | Mitigated by design |
| T-12 | DS2, DS10 | D | Repeated logins or random-username attempts flood the sessions and rate-limit tables. | EP-02 | Rate limit; at most 5 sessions per user (oldest ended); scheduled cleanup of expired rows (V7.1.2). | 4·6·5·5·4 | 4.8 | Medium | Design change (DC-4) |

### B. Password change (EP-06)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-13 | P3 | S | A weak or breached password is accepted at change. | EP-06 | 15 to 128 chars, no composition rules; checked against a bundled common/breached list, offline (A-8) (V6.2.1, V6.2.4, V6.2.12). | 7·6·6·5·5 | 5.8 | Medium | Design change (DC-6) |
| T-14 | P3, E1 | S | An attacker with a hijacked session changes the password to keep access. | EP-06 | Current password required and rate-limited like login; offer to end other sessions (checked by default); change audited (FR-11; V6.2.3, V7.4.3). | 8·5·4·4·5 | 5.2 | Medium | Mitigated by design |

### C. Account and privilege administration (EP-13 to EP-17, TB-3)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-15 | P3, DS1 | I | A temporary password is disclosed: screen, browser history or cache, screenshot, or logs. | EP-13, EP-17 | CSPRNG; shown once with `no-store`; never logged or audited (SR-9); expires (default 24 h) or on first use; must change at first login (V6.4.1, V11.5.1). | 8·5·4·2·4 | 4.6 | Medium | Mitigated by design |
| T-16 | P3, P4 | E | An account with a temporary password reaches other endpoints before changing it. | EP-06, EP-13 | C-11 gate: only EP-05 and EP-06 are reachable while `must_change_password` is set (V6.4.1). | 7·6·5·3·5 | 5.2 | Medium | Design change (DC-1) |
| T-17 | P3, DS1 | T,E | Mass assignment: the client sends `role`, `active`, or hash fields to a profile, password, or incident endpoint. | EP-06, EP-07, EP-14, EP-16 | Strict schema rejecting unknown fields (C-3); role changes only on EP-14 (SR-6, SR-7; V15.3.3, V8.2.3). | 9·6·6·8·5 | 6.8 | High* | Mitigated by design |
| T-18 | P3 | E | An admin changes their own role or deactivates themself, or removes or deactivates the last active admin. | EP-14, EP-15 | Target must differ from the caller (SR-6); last-active-admin check in the same transaction with a row lock; audited (V8.2.1). | 7·5·4·9·5 | 6.0 | High* | Mitigated by design |
| T-19 | P2, P3, P4 | E | Vertical privilege escalation: a user or reviewer calls admin endpoints (or an admin calls reviewer-only ones) by forced browsing. | EP-08 to EP-23, C-2 | Role checked from the DB inside every handler and page, deny by default; role-by-route test matrix; middleware is never the only check (SR-4, SR-5; V8.2.1, V8.3.1). | 9·7·6·9·7 | 7.6 | High | Mitigated by design |
| T-20 | E1, E2, E3 | R | A user, reviewer, or admin denies an action (submit, close, comment, role change, reset). | EP-07, EP-10, EP-11, EP-13 to EP-17 | Audit record for every FR-11 and D-2 action (userId, UTC time, action, targetId) written in the same transaction; unique named accounts (FR-11, SR-10; V16.2.1). | 6·6·3·6·5 | 5.2 | Medium | Mitigated by design |

### D. Admin settings (EP-20)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-21 | P3, DS6 | T,D | A compromised admin weakens or abuses settings (longest sessions, 72 h temp passwords, lockout after 3 attempts for everyone). | EP-20 | Fixed bounds in code; out-of-range values rejected; security-critical settings not configurable; old and new values audited (R-9; V2.2.1). | 5·6·5·8·6 | 6.0 | Medium | Mitigated by design + AR-3 |
| T-22 | P2, DS6 | T | Stored XSS through the public status message shown on the login page. | EP-01, EP-20 | Plain text only; React escaping; 280-char cap; CSP with nonce (SR-7; V3.2.2, V3.4.3). | 8·4·4·9·5 | 6.0 | Medium | Mitigated by design |
| T-23 | P3, DS6 | T | A missing or corrupt settings row makes the app run with no limits (fail open). | EP-20, §1.4.1 | Defaults in code; validate on read; fall back to defaults, never to no limit (V16.5.3). | 6·4·3·9·3 | 5.0 | Medium | Mitigated by design |

### E. Incident data (EP-09, EP-10, EP-19)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-24 | P3, DS3, DS4 | I | IDOR: a reviewer reads a closed incident, or a user reads others' reports, by changing an ID or `reporter_id`. | EP-09, EP-19 | Object-level check inside the query (C-10); `reporter_id` taken from the session only; UUIDs; per-role tests (SR-5; V8.2.2). | 8·7·7·8·7 | 7.4 | High | Mitigated by design |
| T-25 | P3 | I | Different 403 and 404 responses reveal which incident IDs exist. | EP-09 | The same 404 for missing and forbidden records (V8.2.2). | 3·8·7·3·6 | 5.4 | Medium | Mitigated by design |
| T-26 | P3, DS3 | T | A reviewer skips or reverses allowed status transitions, or an admin changes status. | EP-10 | Only open, under-review, closed in order; admin gets 403 (D-3); status change and audit record in one transaction (FR-8; V2.3.1, V2.3.3). | 5·6·5·5·5 | 5.2 | Medium | Mitigated by design |
| T-27 | P3, DS3 | T | Concurrent updates cause lost or conflicting status changes, or let two admin demotions pass the last-admin check (NFR-5). | EP-10, EP-14 | Conditional `UPDATE ... WHERE status = expected`; transactions and row locks (V2.3.4). | 5·4·3·5·3 | 4.0 | Medium | Mitigated by design |
| T-28 | P2, P3, DS1, DS3, DS4 | I | List and detail endpoints return extra fields (descriptions in lists, hashes in the admin user list). | EP-08, EP-12, EP-19 | Explicit per-role field allowlists; `password_hash` never selected (C-9; V15.3.1). | 8·5·5·6·5 | 5.8 | Medium | Mitigated by design |

### F. Other entry points and the audit log (EP-07, EP-11, EP-12, EP-18, EP-21 to EP-23)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-29 | P2, P3, DS3, DS4 | T | Stored XSS in an incident title, description, comment, category name, or username steals a reviewer or admin session. | EP-07, EP-09, EP-11, EP-12, EP-22 | React escaping only; `dangerouslySetInnerHTML` banned by lint; no Markdown; CSP nonce; length limits (SR-7; V3.2.2, V1.3.5). | 9·6·6·8·7 | 7.2 | High | Mitigated by design |
| T-30 | P2, DF-3, DF-4 | I | Authenticated responses are cached by the browser or a shared cache. | C-9 | `Cache-Control: no-store` on authenticated pages and APIs (V14.3.2). | 5·5·4·4·4 | 4.4 | Medium | Mitigated by design |
| T-31 | P3, DS5 | T | A reviewer assigns an inactive or missing category, or categories are removed. | EP-21, EP-22, EP-23 | Category must exist and be active; no DELETE routes (R-8). | 2·5·4·4·4 | 3.8 | Low | Mitigated by design |
| T-32 | P1, P2, P3, DF-3, DF-4, DS3, DS4, DS5 | D | Large bodies, unbounded lists, or floods of authenticated writes exhaust CPU, memory, or storage. | EP-07, EP-08, EP-11, EP-18, EP-19 | Body size cap; field length limits (C-3); paging limits (V15.2.2); per-user write limits left to the edge (NFR-3, NFR-4). | 5·8·6·7·6 | 6.4 | Medium | Mitigated by design + AR-4 |
| T-33 | DS7 | T | The audit log is altered or deleted by SQL injection, a compromised app, or an insider. | EP-18, NH-2 | App DB role has INSERT and SELECT only; trigger rejects UPDATE and DELETE; no write or delete route; owner role used only by migrations (FR-12, SR-11; V16.4.2). | 9·5·5·9·6 | 6.8 | High* | Mitigated by design |
| T-34 | DS7 | I | The audit log leaks sensitive data or is readable by non-admins. | EP-18 | Record only action and IDs, never descriptions or secrets; admin-only; `no-store` (SR-9; V16.2.5). | 7·5·5·5·5 | 5.4 | Medium | Mitigated by design |
| T-35 | P3, P4, DS7 | R | A key action succeeds without an audit record, or failed authentication and authorization attempts are not recorded. | C-8, FR-11 | Audit insert in the same transaction as the action, fail closed; failures go to application logs (V2.3.3, V16.3.1, V16.3.2). | 7·5·5·8·5 | 6.0 | Medium | Design change (DC-5) |
| T-36 | DS7 | D | Audit table growth or flooding fills storage (rows can't be deleted). | EP-18 | Audit only FR-11 and D-2 actions (never reads or failed logins); paging; storage alarm (FR-12). | 4·5·4·6·4 | 4.6 | Medium | Design change (DC-5) |
| T-37 | E4, P5 | R | Operator actions (create-admin CLI, migrations) leave no audit record. | NH-4, NH-5 | CLI writes a `user.create` audit record with actor `system`; migrations are logged by the CI or job runner (FR-11; V16.2.1). | 6·6·4·3·4 | 4.6 | Medium | Design change (DC-3) |

### G. Database and data layer (TB-2, NH-1, NH-2)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-38 | P3, DS1, DS2, DS3, DS4, DS5, DS6, DS7, DS10 | T | SQL injection through filters, IDs, status values, or text input. | SR-8, C-5, D-6 | ORM or parameterized queries only; raw unsafe APIs banned (lint + CI grep); enum and UUID schemas; least-privilege app role (V1.2.4, V2.2.1). | 10·5·5·10·6 | 7.2 | High | Mitigated by design |
| T-39 | DF-6, DF-7, DF-8, DF-9, DF-10, DF-11, DF-12, DF-16 | T,I | DB traffic sniffed or altered on the internal network. | NH-1, TB-2 | Private network only; TLS to the DB on AWS (RDS `require_ssl`); the local Docker network is internal and carries demo data only (V12.3.1, V13.2.1). | 8·4·3·8·4 | 5.4 | Medium | Mitigated by design |
| T-40 | DS1, DS2 | I | A database read (backup, SQLi, stolen credentials) exposes password hashes and session tokens. | NH-2 | argon2id with tuned parameters; session tokens stored only as hashes; encrypted backups (SR-2; V11.4.2, V7.2.3). | 9·3·3·8·4 | 5.4 | Medium | Mitigated by design |
| T-41 | DS1, DS2, DS3, DS4, DS5, DS6, DS7, DS9, DS10, DF-6, DF-7, DF-8, DF-9, DF-10, DF-11, DF-12, DF-14, DF-16 | D | Database or secrets store unavailable, or the connection pool exhausted. | NH-1, NH-3, NFR-6 | Pool limits and timeouts; generic error page; backups; graceful recovery (NFR-6; V16.5.2, V16.5.3). | 5·5·5·9·5 | 5.8 | Medium | Mitigated by design |
| T-42 | P5, DF-16 | T,E | The app uses the owner (DDL) role, so a SQL injection can alter the schema or drop tables. | NH-2 | Separate owner and app roles; app role has no DDL; no superuser; owner credential used only by the migration job (V13.2.2). | 9·4·4·9·4 | 6.0 | Medium | Mitigated by design |

### H. Framework surfaces (FW-1 to FW-6)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-43 | P1 | S,E | Middleware bypass (CVE-2025-29927, `x-middleware-subrequest`) skips authentication or headers. | FW-1 | No auth in middleware (C-2); patched `next`; reject requests carrying `x-middleware-subrequest` at the edge and in code (V15.2.1, V15.1.1). | 9·4·5·9·6 | 6.6 | High* | Mitigated by design |
| T-44 | P1, P2, P3 | T,E | A Next.js or React vulnerability (e.g. the Dec 2025 RSC RCE) gives code execution or an auth bypass. | FW-2, NH-8 | Pinned patched versions; `npm audit` gate and Dependabot; non-root container; least-privilege DB role; no outbound egress (V15.1.1, V15.2.1). | 10·4·5·10·8 | 7.4 | High | Mitigated by design |
| T-45 | P3 | E | A Server Action (`"use server"`) is added later, creating a hidden POST endpoint without authorization. | FW-3, A-5 | ESLint rule and CI grep fail on `"use server"`; PR review; AGENTS.md rule (SR-5). | 7·5·4·7·4 | 5.4 | Medium | Mitigated by design |
| T-46 | P2 | D | The image optimizer is abused for SSRF or resource exhaustion. | FW-4 | `images.unoptimized: true`; no `remotePatterns`; no outbound calls (A-8; V1.3.6). | 4·3·3·5·4 | 3.8 | Low | Mitigated by design |
| T-47 | P1, P2, P3, DF-3, DF-4 | I | Stack traces, version headers, source maps, or health-check details disclose internals. | EP-03, EP-04, FW-5 | `error.tsx` and `not-found.tsx`; `poweredByHeader: false`; no source maps; health returns only `{status:"ok"}`; no `next dev` outside a developer machine (NFR-2, SR-12; V13.4.2, V13.4.5, V15.2.3). | 3·8·7·6·8 | 6.4 | Medium | Mitigated by design |
| T-48 | P3 | T,I | Unexpected HTTP methods (TRACE, OPTIONS, HEAD, method override) reach handlers. | FW-6 | Each route exports only the methods it needs; others return 405 (V13.4.4, V3.5.3). | 3·5·4·3·4 | 3.8 | Low | Mitigated by design |
| T-49 | P1, DF-3, DF-4 | T | Security headers are missing on some responses (errors, static files, API), enabling XSS or clickjacking. | C-7, FW-1 | Headers set in middleware with a matcher covering every path; header-assertion test on pages, API, and error responses (SR-16; V3.4.1, V3.4.3, V3.4.5). | 6·6·5·8·7 | 6.4 | Medium | Mitigated by design |

### I. Operator plane, edge, and supply chain (NH-3 to NH-10)

| ID | Element(s) | STRIDE | Threat | Refs | Mitigations | D·R·E·A·D | Avg | Severity | Status |
|---|---|---|---|---|---|---|---|---|---|
| T-50 | P6, DF-2, DS10 | S,T | A forged `X-Forwarded-For` header evades per-IP limits or poisons logs. | NH-10, TB-5 | Trust the header only from the ALB (rightmost trusted hop); the app is reachable only through the ALB; log the verified IP (V15.3.4). | 5·7·6·6·6 | 6.0 | Medium | Mitigated by design |
| T-51 | P6, DF-1, DF-2 | D | Volumetric DoS against the public endpoint. | NH-10 | ALB or CloudFront in front; optional AWS WAF rate rules; autoscaling; not exposed in the local demo. | 5·7·6·9·6 | 6.6 | Medium | Accepted (AR-4) |
| T-52 | DS1, DS3 | I | PostgreSQL is published to the host or the internet (compose `ports:`, public RDS), letting an outsider attack the database directly. | NH-1 | No `ports:` on the DB service (CI check); RDS in a private subnet, not publicly accessible, security group allows only the app; strong unique credentials (V13.2.1, V12.3.1). | 9·5·5·10·7 | 7.2 | High | Mitigated by design |
| T-53 | DS9, DF-14 | T,I | DB credentials are stored or committed in plaintext (`.env`), or tampered with (D-4, SR-14). | NH-3 | dotenvx: encrypted `.env` committed, `.env.keys` gitignored and `.dockerignore`d, private key injected at runtime; AWS Secrets Manager via the task role; secret scanning; separate owner and app credentials (SR-14; V13.3.1, V13.3.2). | 9·6·5·10·6 | 7.2 | High | Mitigated (D-4 resolved) + AR-5 |
| T-54 | DS8, DF-13 | T | Log injection: CR/LF or control characters forge or hide log entries. | NH-6 | JSON logs; control characters encoded; length caps (SR-13; V16.2.4). | 4·6·5·4·4 | 4.6 | Medium | Mitigated by design |
| T-55 | DS8, DF-13 | I | Passwords, tokens, descriptions, or SQL end up in logs or error output. | NH-6, C-6 | Logger with field allowlists; `console.log` of bodies banned; errors scrubbed before logging; generic client errors (SR-9, SR-12, SR-13; V16.2.5, V16.3.4, V16.5.1). | 7·6·5·6·5 | 5.8 | Medium | Mitigated by design |
| T-56 | DS8, DF-17 | T,I | Logs are readable or deletable by too many people, or destroyed to hide an attack. | NH-6 | CloudWatch with restricted IAM read, retention, and a separate system from the app; container logs on stdout only (SR-11; V16.4.1, V16.4.3). | 6·4·3·5·3 | 4.2 | Medium | Mitigated by design |
| T-57 | DS8, DF-13 | D | Log flooding (error loops, attacker traffic) fills storage or hides real events. | NH-6 | No per-request body logging; cap on repeated errors; retention; alarms. | 3·7·6·4·5 | 5.0 | Medium | Mitigated by design |
| T-58 | E4, DF-18 | S,T | A compromised developer or GitHub account, or a CI secret, pushes malicious code. | NH-8, TB-4 | Branch protection and required PR review on `main`; 2FA; minimal CI permissions, no long-lived cloud keys; secret scanning (CONST-2; V15.2.1). | 10·3·3·10·3 | 5.8 | Medium | Mitigated by design + AR-1 |
| T-59 | DF-18 | T | A malicious or vulnerable npm package (typosquat, compromised maintainer, install script). | NH-8 | Lockfile and `npm ci`; `npm audit` and Dependabot; minimal dependencies; review every new dependency; dependency list kept for release (V15.1.1, V15.1.2, V15.2.1). | 9·4·4·10·5 | 6.4 | Medium | Mitigated by design |
| T-60 | DF-18, P3 | T | AI-generated code adds vulnerabilities: hallucinated packages, missing authorization on a new route, banned APIs, insecure defaults (CONST-3). | NH-8 | AGENTS.md rules; lint bans; per-route authorization tests; SAST; human review of every AI change; AI-USAGE-REPORT.md (SR-4, SR-5; V15.2.1). | 8·6·5·8·6 | 6.6 | Medium | Mitigated by design |
| T-61 | P2, P3, DF-18 | I,E | The container runs as root, or secrets and source (`.git`, `.env*`) end up in image layers. | NH-7 | Non-root user; `.dockerignore` excludes `.git`, `.env*`, tests; no secrets in build args; no SSH (use SSM) (V13.4.1, V15.2.3). | 9·3·3·8·4 | 5.4 | Medium | Mitigated by design |
| T-62 | P5, DF-15 | S,T,I,E | First-admin bootstrap is abused: a web setup page, a default admin, or a password passed on the command line. | NH-4 | CLI only; no setup page or seeded admin; password prompted, not taken from argv or env; audited (DC-3) (V6.3.2). | 9·3·3·9·4 | 5.6 | Medium | Mitigated by design |
| T-63 | P5, DS1 | T | Seed data or test accounts with known passwords reach a deployed environment. | NH-5, ASSUMP-2 | Seeds run only through an explicit dev command and never in the image's start path; CI check; fake data only (ASSUMP-2; V13.4.2). | 8·4·5·9·5 | 6.2 | Medium | Mitigated by design |
| T-64 | P2 | I | Sensitive data is kept in `localStorage` or `sessionStorage`, or leaks through URLs and the Referer header. | NH-9 | Only the session cookie client-side; no secrets in URLs; `Referrer-Policy` (C-7; V14.3.3). | 4·3·3·4·3 | 3.4 | Low | Mitigated by design |

## Coverage by element

Every applicable STRIDE category for every element has at least one threat or an N/A reason. `·` = category doesn't apply to that element type.

| Element | S | T | R | I | D | E |
|---|---|---|---|---|---|---|
| E1 User | 01, 14 | · | 20 | · | · | · |
| E2 Reviewer | 01 | · | 20 | · | · | · |
| E3 Admin | 01 | · | 20 | · | · | · |
| E4 Operator / developer | 58 | · | 37 | · | · | · |
| P1 Middleware | 43 | 44, 49 | N/A (N2) | 47 | 32 | 43, 44 |
| P2 Pages + RSC rendering | 08 | 22, 29, 44 | N/A (N2) | 28, 30, 47, 61, 64 | 32, 46 | 19, 44, 61 |
| P3 Route Handlers | 01, 09, 13, 14 | 17, 21, 23, 26, 27, 29, 31, 38, 44, 48, 60 | 35 | 02, 15, 24, 25, 28, 47, 48, 61 | 03, 04, 21, 32 | 16, 17, 18, 19, 44, 45, 61 |
| P4 Session + RBAC module | 05, 08, 10 | 11 | 35 | 02 | 04 | 16, 19 |
| P5 create-admin CLI + migrations | 62 | 42, 62, 63 | 37 | 62 | N/A (N5) | 42, 62 |
| P6 Edge proxy / ALB | 50 | 06, 50 | N/A (N6) | 06 | 51 | N/A (N7) |
| DS1 users | · | 17, 38, 63 | · | 15, 28, 40, 52 | 03, 41 | · |
| DS2 sessions | · | 38 | · | 40 | 12, 41 | · |
| DS3 incidents | · | 26, 27, 29, 38 | · | 24, 28, 52 | 32, 41 | · |
| DS4 comments | · | 29, 38 | · | 24, 28 | 32, 41 | · |
| DS5 categories | · | 31, 38 | · | N/A (N3) | 32, 41 | · |
| DS6 settings | · | 21, 22, 23, 38 | · | N/A (N3) | 21, 41 | · |
| DS7 audit_log | · | 33, 38 | 35 | 34 | 36, 41 | · |
| DS8 application logs | · | 54, 56 | · | 07, 55, 56 | 57 | · |
| DS9 secrets store | · | 53 | · | 53 | 41 | · |
| DS10 login_attempts | · | 38, 50 | · | N/A (N4) | 12, 41 | · |
| DF-1 Browser <-> Edge | · | 06 | · | 06 | 51 | · |
| DF-2 Edge -> Middleware | · | 06, 50 | · | 06 | 51 | · |
| DF-3 Middleware -> Pages/RSC | · | 49 | · | 30, 47 | 32 | · |
| DF-4 Middleware -> Route Handlers | · | 49 | · | 30, 47 | 32 | · |
| DF-5 Pages/Handlers -> Session + RBAC | · | N/A (N1) | · | N/A (N1) | N/A (N1) | · |
| DF-6 Session + RBAC <-> users, sessions | · | 39 | · | 39 | 41 | · |
| DF-7 App <-> incidents, comments, categories | · | 39 | · | 39 | 41 | · |
| DF-8 Handlers <-> users | · | 39 | · | 39 | 41 | · |
| DF-9 App <-> settings | · | 39 | · | 39 | 41 | · |
| DF-10 Handlers -> audit_log (append) | · | 39 | · | 39 | 41 | · |
| DF-11 audit_log -> Admin audit page | · | 39 | · | 39 | 41 | · |
| DF-12 App <-> login_attempts | · | 39 | · | 39 | 41 | · |
| DF-13 App -> application logs | · | 54 | · | 55 | 57 | · |
| DF-14 Secrets store -> App | · | 53 | · | 53 | 41 | · |
| DF-15 Operator -> CLI / migrations | · | 62 | · | 62 | N/A (N5) | · |
| DF-16 CLI / migrations -> database | · | 39, 42 | · | 39 | 41 | · |
| DF-17 Operator -> reads logs | · | 56 | · | 56 | N/A (N8) | · |
| DF-18 GitHub / CI -> container image | · | 58, 59, 60 | · | 61 | N/A (N8) | · |

Numbers are threat IDs (`7` = T-07). N/A reasons:

- **N1:** In-process call inside one Node process; the threats sit on P3 and P4.
- **N2:** Takes no auditable action; actions are audited in P3.
- **N3:** Values are Internal or Public and are already visible to the roles that can query them.
- **N4:** Counters are never returned by any endpoint.
- **N5:** Single run by an operator; no availability requirement.
- **N6:** Operator-side control; no app audit trail applies (ALB access logs).
- **N7:** Managed AWS service with no app code; infrastructure misconfiguration is covered by NH-1 and NH-10.
- **N8:** Reading logs or running CI does not affect the running service.

## Accepted risks

| ID | Residual risk |
|---|---|
| AR-1 | Operators with container, database-owner, or cloud-console access are trusted (TB-4). Controlled by process (SSM, IAM, 2FA), not by the app. |
| AR-2 | A determined attacker can keep one named account locked by repeating failed logins. Lockout is temporary and bounded, there is no CAPTCHA or MFA in scope, and the user can retry after the window. |
| AR-3 | An admin can read every incident (FR-10) and change bounded settings. The bounds and audit trail limit abuse, but a malicious admin is not fully prevented. |
| AR-4 | Volumetric DoS and write floods by authenticated users are handled at the edge (ALB, optional WAF), not in the app. The local course demo is not internet-exposed. |
| AR-5 | `DOTENV_PRIVATE_KEY` is visible to anyone who can inspect the running container or task definition. Local use only, with demo credentials; on AWS use Secrets Manager instead. |
| AR-6 | No MFA (not required by the assignment). Credential theft stays the main account-takeover path; limited by 15-character passwords, lockout, and rate limits. |
| AR-7 | Malware or a compromised browser on a user's device is out of scope. |

## Design changes found by this analysis

Applied to [threat-model.md](threat-model.md) Part 1 in the same change.

| ID | Change | Where |
|---|---|---|
| DC-1 | New common control **C-11**: while `must_change_password` is set, only EP-05 and EP-06 are reachable. | §1.3 |
| DC-2 | C-4 extended: a missing `Origin` is rejected, and writes must be `Content-Type: application/json`. | §1.3 |
| DC-3 | The create-admin CLI writes a `user.create` audit record with actor `system` (FR-11). | NH-4 |
| DC-4 | Lockout and rate-limit state in the database: `users.failed_login_count`, `users.locked_until`, new `login_attempts` store; sessions capped at 5 per user. | EP-02, §1.7 |
| DC-5 | C-8 clarified: failed authentication/authorization attempts go to application logs, not the append-only audit table. | §1.3 |
| DC-6 | EP-06's breached-password check uses a bundled offline list (A-8: no outbound calls). | EP-06 |

## Summary

64 threats: **12 High**, 47 Medium, 5 Low. 7 need a design change, all applied in Part 1.

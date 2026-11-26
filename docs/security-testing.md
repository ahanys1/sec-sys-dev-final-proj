# SAST, DAST, and Manual Security Testing

Team #13

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#9-acceptance-criteria)

Status: Local SAST, DAST, and integrated verification results are documented in the [Slice 7 report](evidence/slice7/README.md) and its sanitized `results.json` (PR #63). Independent manual security testing results are documented in Section 3 (PR #65). The results apply to their respective tested application revisions and documented testing scopes. Live scans and final release acceptance are not claimed.

## 1. Static Application Security Testing (SAST)

### 1.1 Objective

Static Application Security Testing (SAST) was performed to identify potentially insecure coding patterns in the incident-reporting application's Next.js and TypeScript source code. The analysis focused on vulnerabilities identified in the STRIDE threat model, particularly injection, cross-site scripting, improper authorization, sensitive information exposure, and security weaknesses introduced through AI-assisted development.

The purpose of SAST is to identify potential vulnerabilities early, review whether the implementation follows the team's documented security design, and provide evidence for remediation and verification.

### 1.2 Tools and Methodology

Semgrep was used as the primary security-focused static
analysis tool, supplemented by GitHub CodeQL analysis,
ESLint, and TypeScript checks. Dependency vulnerability
scanning (`npm audit`) and secret scanning were treated
as separate verification activities.

Local static analysis was performed using Semgrep 1.185.0
with the following rulesets:

- `p/typescript`
- `p/nextjs`
- `p/owasp-top-ten`

The verification methodology included:

1. Scanning the application source code and supporting
   verification scripts using applicable security rules.
2. Reviewing reported findings through source-code
   inspection.
3. Identifying actionable findings and determining
   appropriate remediation.
4. Repeating static analysis following remediation.
5. Executing supplementary linting, TypeScript checks,
   and automated tests.
6. Reviewing GitHub CI and SAST workflow execution results.

Static analysis results and remediation evidence were
documented as part of the local Slice 7 verification
activities (PR #63).

### 1.3 Threat-Based Analysis Priorities

The following threats guided the static analysis priorities and source-code inspection:

- **T-29 — Stored XSS:** Identify unsafe HTML rendering and violations of the plain-text rendering design.
- **T-38 — SQL Injection:** Identify dynamically constructed SQL statements and prohibited unsafe query methods.
- **T-17/T-19 — Mass Assignment and Privilege Escalation:** Review request validation and server-side authorization patterns.
- **T-33 — Audit Log Tampering:** Inspect application code for prohibited audit modification operations and review database permission definitions.
- **T-43/T-45 — Framework Authorization Bypass:** Identify reliance on middleware for authorization and any unintended Server Actions.
- **T-53 — Secrets Exposure:** Inspect source and configuration for hardcoded credentials or improperly stored secrets.
- **T-60 — AI-Generated Code Vulnerabilities:** Review generated code for insecure patterns, omitted controls, and deviations from established design decisions.

Controls that could not be reliably verified through static analysis were addressed through complementary automated integration, DAST, manual security testing, or deployment verification activities where applicable.

### 1.4 Results and Evidence

Static application security testing was completed on
November 25, 2026, as part of the local Slice 7
verification activities.

The final verification results correspond to application
commit `f53b465e1438be8e0381f8ea2904dbe3121c8f17`.

| Verification Activity | Result |
|---|---|
| Semgrep version | 1.185.0 |
| Files scanned | 171 |
| Final Semgrep findings | 0 |
| Semgrep execution errors | 0 |
| CodeQL version | 2.27.5 |
| CodeQL workflow execution | PASS |
| ESLint | PASS |
| TypeScript compilation checks | PASS |
| Unit tests | 110 passing |
| PostgreSQL integration tests | 131 passing |
| Production dependency vulnerabilities | 0 |

Initial Semgrep analysis identified four unverified TLS
contexts in Python verification clients. These findings
were associated with the supporting test infrastructure
rather than the application runtime.

The affected clients were updated to verify TLS
connections against the isolated Caddy certificate
authority. Subsequent Semgrep analysis reported zero
findings and zero execution errors.

GitHub CodeQL analysis was executed successfully through
SAST workflow run 108 against the tested application
revision.

Detailed findings, remediation decisions, and threat
verification references are provided in Section 5.

**Supporting Evidence:**

- [Slice 7 Verification Report](evidence/slice7/README.md)
- [Sanitized Verification Results](evidence/slice7/results.json)
- [GitHub CI Run 108](https://github.com/ahanys1/sec-sys-dev-final-proj/actions/runs/45663427395)
- [GitHub SAST Run 108](https://github.com/ahanys1/sec-sys-dev-final-proj/actions/runs/45663427675)
- PR #63
- Section 5.1, Finding F-04

### 1.5 Limitations

SAST cannot demonstrate that the application correctly
enforces every security requirement at runtime. Missing
authorization checks, improper role permissions, session
behavior, and database access restrictions may require
additional verification.

Static analysis coverage is dependent on the selected
rulesets, scanner capabilities, and tested application
revision. A scan reporting zero findings does not
establish the absence of all security vulnerabilities.

CodeQL was executed through GitHub CI because the
CodeQL CLI was unavailable in the local verification
environment.

SAST results were therefore evaluated alongside DAST,
automated integration tests, manual security testing,
deployment verification, and the STRIDE threat model.

## 2. Dynamic Application Security Testing (DAST)

### 2.1 Objective

Dynamic Application Security Testing (DAST) was performed against the running incident-reporting application to identify security vulnerabilities observable through HTTP requests and responses. Unlike SAST, which examines source code, DAST evaluates the application's behavior from an external perspective.

Testing focused on authentication and session mechanisms, access restrictions, input handling, security headers, and API endpoints identified in the STRIDE threat model. DAST provided supporting evidence for evaluating whether the implemented application enforces the security controls specified during the design phase.

### 2.2 Tools and Methodology

OWASP ZAP 2.17.0 was used as the primary DAST tool for
assessing the running Next.js application. Testing was
conducted against an isolated local Docker deployment
using synthetic accounts and incident data.

The verification methodology included:

1. Building and deploying the application in an isolated
   local testing environment.
2. Performing public, unauthenticated passive and spider
   scans against the application.
3. Performing authenticated passive and spider scans using
   provisioned sessions for the User, Reviewer, and Admin
   roles.
4. Reviewing scanner-generated alerts through source-code
   inspection and complementary security testing.
5. Executing deterministic HTTP security probes to evaluate
   authorization, session invalidation, cross-origin request
   restrictions, malformed inputs, safe rendering, and
   native form submission behavior.
6. Remediating confirmed vulnerabilities and repeating
   relevant scans and verification activities.

Automated HTTP security probes supplemented ZAP scanning
to evaluate application-specific security controls that
could not be reliably assessed through passive scanning
alone.

Testing was restricted to the authorized local verification
environment. Broad active vulnerability scanning and
live-host DAST were not performed.

### 2.3 Threat-Based Testing Priorities

DAST and complementary HTTP security testing were guided by the STRIDE analysis and its identified entry points:

- **T-01 — Brute Force:** Evaluate login rate limiting and account lockout behavior using controlled requests.
- **T-08/T-09 — Session Replay and CSRF:** Examine session invalidation and protection against unauthorized cross-origin state-changing requests.
- **T-17/T-19 — Mass Assignment and Privilege Escalation:** Evaluate whether unauthorized request fields and restricted API operations are rejected.
- **T-24 — Insecure Direct Object References:** Test whether changing incident identifiers allows access to records outside the requesting user's permissions.
- **T-29 — Stored XSS:** Examine how user-supplied incident data and comments are rendered.
- **T-33 — Audit Log Tampering:** Examine whether exposed application interfaces permit unauthorized audit modification.
- **T-38 — SQL Injection:** Assess applicable input parameters for unsafe database query behavior.
- **T-43 — Middleware Authorization Bypass:** Verify that crafted requests cannot bypass authentication or authorization controls.
- **T-49 — Security Headers:** Inspect security headers across application pages, API responses, and error responses.

Authorization, session management, and business-logic controls requiring precise role or application-state knowledge were evaluated through complementary HTTP security probes, automated integration tests, and manual security testing where applicable.

### 2.4 Results and Evidence

Dynamic application security testing was completed on
November 25, 2026, as part of the local Slice 7 verification
activities.

The final verification results correspond to application
commit `f53b465e1438be8e0381f8ea2904dbe3121c8f17`.

| Verification Activity | Result |
|---|---|
| OWASP ZAP version | 2.17.0 |
| Unauthenticated passive/spider scan | Completed |
| Authenticated User scan | Completed |
| Authenticated Reviewer scan | Completed |
| Authenticated Admin scan | Completed |
| Deterministic HTTP security checks | 151/151 passed |
| Confirmed native GET fallback vulnerability | Remediated and retested |
| Broad active scanning | Not performed |
| Live-host DAST | Not performed |

Initial ZAP scanning identified a native form submission
weakness in which form fields, including login credentials,
could be serialized into URL query parameters when
JavaScript did not intercept the submission.

The affected forms were updated to explicitly declare
the POST method. Subsequent rendered-HTML verification
and repeat scans validated the remediation.

Additional scanner-generated alerts were reviewed against
the implemented security controls and complementary
verification results.

| ZAP Alert | Reported Risk | Disposition |
|---|---|---|
| 10024 - Sensitive information in URL | Informational (rated Medium under the bug bar as F-01) | Fixed and retested |
| 10202 - Absence of anti-CSRF tokens | Medium | False positive within the verified JSON API design |
| 90004 - Missing or invalid COEP header | Low | Recorded; not remediated |
| 10044 - Big redirect detected | Low | Reviewed; no sensitive disclosure identified |
| 10031 - User-controllable HTML element attribute | Informational | Reviewed against rendering and server-side validation controls |

The anti-CSRF token alerts were evaluated against the
application's same-origin request validation, JSON
content-type enforcement, and SameSite=Strict session
cookie configuration. Complementary HTTP security probes
confirmed rejection of foreign, missing, and null origins,
as well as unsupported form content types.

All 151 deterministic HTTP security checks passed within
their defined verification scope.

Detailed findings, remediation decisions, and threat
verification references are provided in Section 5.

**Supporting Evidence:**

- [Slice 7 Verification Report](evidence/slice7/README.md)
- [Sanitized Verification Results](evidence/slice7/results.json)
- PR #63
- Section 5.1, Finding F-01 and ZAP alert dispositions
- Section 5.2, High-threat verification
- Section 3.6, Manual Security Testing Results Matrix

### 2.5 Limitations

DAST evaluates application behavior through exposed
interfaces and may not identify vulnerabilities in code
paths or components that are not exercised during testing.

The following limitations apply to the executed dynamic
security testing activities:

- ZAP testing was limited to passive and spider scans
  against an isolated local deployment.
- Broad active vulnerability scanning was not performed.
- Authenticated scans relied on explicitly provisioned
  sessions rather than automated login discovery.
- Passive spider discovery did not exercise every
  JavaScript-driven application workflow.
- Deterministic malformed-input testing was limited to
  selected inputs and did not constitute exhaustive fuzzing.
- HTTP security probes did not constitute comprehensive
  interactive browser testing.
- Live-host DAST was not performed.

Automated scanners may also fail to recognize
application-specific authorization requirements,
business-logic weaknesses, or database-level permission
issues.

DAST results were therefore evaluated alongside SAST,
automated integration tests, manual security testing,
deployment verification, and the STRIDE threat model.

Successful verification of the tested controls does not
establish the absence of all security vulnerabilities.

## 3. Manual Security Testing

### 3.1 Objective

Manual security testing was performed to evaluate application-specific security controls that cannot be fully verified through automated static or dynamic analysis. Testing focused on authentication, role-based access control, incident ownership, session management, audit logging, input handling, and deployment security.

The objective is to determine whether the implemented application enforces the permissions, restrictions, and security requirements defined during the design phase. Particular attention was given to high-risk threats identified in the STRIDE analysis and potential security weaknesses introduced through AI-assisted development.

### 3.2 Tools and Methodology

Manual testing was conducted against a local Docker deployment
using controlled test accounts and synthetic incident data.
Firefox Developer Tools, Docker CLI, WSL command-line utilities,
and Windows PowerShell were used to inspect application behavior,
construct HTTP requests, and verify deployment security controls.

The following methodology was used:

1. Established test accounts for the User, Reviewer, and Admin
   roles, along with representative incident records.
2. Exercised normal application workflows and attempted
   unauthorized operations.
3. Constructed direct HTTP requests to test authentication,
   authorization, input validation, and workflow restrictions.
4. Compared observed behavior against the expected security
   controls and STRIDE mitigations.
5. Inspected application state following requests to verify
   that unauthorized modifications had not occurred.
6. Inspected container configuration, filesystem contents,
   and host-level database connectivity.
7. Documented observed results and repeated preliminary tests
   against the updated application build where necessary.

Test cases are mapped to relevant STRIDE threat identifiers
and use/misuse cases.

### 3.3 Threat-Based Testing Priorities

The following scenarios guided manual testing:

- **T-01 — Brute Force:** Verify that repeated failed login attempts trigger the intended rate limits and temporary lockout behavior.
- **T-08 — Session Replay:** Verify that session credentials cannot be reused after logout or administrative revocation.
- **T-17 — Mass Assignment:** Attempt to submit unauthorized fields, including `role` and `active`, through application requests.
- **T-18/T-19 — Privilege Escalation:** Verify that administrative role restrictions and server-side authorization checks prevent prohibited operations.
- **T-24 — Insecure Direct Object References:** Attempt to access incident records belonging to other users or outside the requester's permitted scope.
- **T-26 — Separation of Duties:** Verify that Admin accounts cannot perform reviewer-only incident status changes.
- **T-29 — Stored XSS:** Submit controlled HTML or script test inputs in incident fields and verify that they are rendered safely.
- **T-33 — Audit Log Tampering:** Verify that audit records cannot be modified or deleted through application interfaces or the application database role.
- **T-38 — SQL Injection:** Submit controlled injection test inputs and verify that database operations remain properly constrained.
- **T-43 — Middleware Bypass:** Verify that protected endpoints continue to enforce authorization when requests attempt to bypass middleware.
- **T-52 — Database Exposure:** Verify that PostgreSQL is not accessible from unauthorized network locations.
- **T-53 — Secrets Exposure:** Inspect deployment configuration and container contents for unintended exposure of credentials or private keys.

The priorities above define the broader manual security testing scope. The executed test cases and their observed results are documented in Section 3.6. Additional threat coverage is provided through automated integration testing, SAST, DAST, and deployment verification where applicable.

### 3.4 Results and Evidence

All 13 planned manual security test cases were executed against
commit `17158b2` in a local Docker deployment using synthetic
accounts and incident data.

Each test documents the applicable threat identifier, attempted
operation, expected behavior, observed behavior, and pass/fail
result. Detailed results are provided in Section 3.6.

Verification was based on observed HTTP responses, application
state following attempted operations, audit records, container
filesystem inspection, and host-level network connectivity checks.
Observed results are documented in the manual testing results
matrix in Section 3.6.

| Metric | Result |
|---|---:|
| Planned test cases | 13 |
| Executed test cases | 13 |
| Passed | 13 |
| Failed | 0 |
| Not executed | 0 |
| Test execution coverage | 100% |
| Test pass rate | 100% |

All 13 test cases passed within their defined testing scope.
No successful security bypass or unauthorized modification
was observed during testing.

### 3.5 Limitations

Manual security testing is dependent on the selected test scenarios,
tester knowledge, and available application functionality. It may
not identify vulnerabilities outside the tested workflows or
configurations.

The following limitations apply to the executed manual tests:

- Testing was limited to the identified local application revision
  and deployment environment.
- XSS and SQL injection testing was limited to selected inputs
  and application workflows.
- Audit integrity testing verified application-level restrictions,
  rather than database-level immutability.
- Database network isolation was verified through Docker port
  configuration and local host connectivity tests.
- Container secret inspection was limited to the accessible
  filesystem of the running application container. Historical
  image layers, image metadata, and runtime environment variables
  were not examined.
- The defensive layer responsible for rejecting the middleware
  bypass request was not independently isolated.
- Manual verification results are documented in the results matrix.
  Separate screenshots and raw HTTP request/response artifacts
  are not included.

The reported pass rate applies only to the executed test cases
and does not establish exhaustive security coverage or the
absence of all vulnerabilities.

The results should be considered alongside SAST, DAST, automated
integration tests, deployment verification, and the STRIDE
threat model.

### 3.6 Manual Security Testing Results Matrix

The following matrix documents the executed manual security test cases, associated STRIDE threats, expected behavior, observed results, and verification status.

| Test ID | Threat ID | Test Scenario | Expected Result | Observed Result | Status |
|---|---|---|---|---|---|
| MAN-01 | T-19 | User requests Admin-only endpoint. | Access denied; no data modified. | HTTP 403 returned for restricted API requests. No unauthorized modification occurred. Verified against the updated application build. | PASS |
| MAN-02 | T-24 | User requests another User's incident. | Incident data not disclosed. | HTTP 404 returned with no incident data disclosed. The other User's incident was absent from My Incidents. | PASS |
| MAN-03 | T-17 | User adds `role: admin` to a request body. | Request rejected; role unchanged. | HTTP 400 returned for the unexpected role property. No incident was created, and the User role remained unchanged. | PASS |
| MAN-04 | T-18 | Admin attempts to demote or deactivate themself. | Operation denied. | Both direct API requests returned HTTP 403. The administrator retained their role, active account, and authenticated session. | PASS |
| MAN-05 | T-26 | Admin attempts Reviewer-only status change. | Operation denied; incident status unchanged. | HTTP 403 returned. The incident remained in the `open` state. | PASS |
| MAN-06 | T-08 | Reuse session token after logout. | Session rejected. | Replay of the original session token returned HTTP 401 following logout. Transmission of the original token was confirmed. | PASS |
| MAN-07 | T-29 | Submit script-like content in incident description. | Content displayed without script execution. | Stored HTML and JavaScript event-handler content was rendered as literal text in the Reviewer interface. No JavaScript execution occurred. | PASS |
| MAN-08 | T-33 | Attempt audit record modification. | Modification denied; audit records unchanged. | Direct PATCH and DELETE requests returned HTTP 405. Existing audit history remained unchanged. | PASS |
| MAN-09 | T-38 | Submit SQL injection test input. | No unauthorized query behavior. | SQL injection input in audit query parameters returned HTTP 400. SQL-like incident description content was stored and retrieved as literal text without observable unintended database behavior. | PASS |
| MAN-10 | T-43 | Send middleware-bypass request header. | Protected operation remains denied. | Request containing the `x-middleware-subrequest` header returned HTTP 400. The baseline unauthorized request returned HTTP 403. No administrative data was disclosed. | PASS |
| MAN-11 | T-52 | Check database reachability from outside its trusted network. | Database connection unavailable. | PostgreSQL port 5432 was not published to the host. TCP connection attempts from Windows and WSL failed while the database remained healthy. | PASS |
| MAN-12 | T-53 | Inspect application container for plaintext private keys. | No unintended secrets exposed. | Filesystem inspection identified no matching `.pem`, `.key`, or `.env*` files. A content-based search of the application directory found no recognizable plaintext private key markers. | PASS |
| MAN-13 | T-26 | Reviewer performs an authorized incident status change. | Status updated successfully. | HTTP 200 returned. The incident transitioned from `open` to `under_review`, the change persisted after refresh, and a corresponding audit record contained the correct actor and target identifiers. | PASS |

## 4. Security Testing Traceability Matrix

### 4.1 Misuse Case Coverage

The following matrix maps the misuse cases documented in
`docs/use-misuse-cases.md` to their associated STRIDE threats,
verification methods, and supporting verification evidence.

Verification evidence was collected through manual security
testing, automated unit and database integration tests,
deterministic HTTP security probes, SAST, DAST, dependency
scanning, and deployment verification.

Testing methods overlap because individual threats may require
multiple forms of verification. Results are evaluated collectively
against the expected defensive behavior of each misuse case.

| Misuse Case | STRIDE Threats | Manual Test References | Additional Verification Evidence |
|---|---|---|---|
| MC-01 — Failed sign-ins and enumeration | T-01–T-04 | — | Authentication integration tests; per-account lockout and per-IP rate limiting; Section 5.2 |
| MC-02 — Invalid or replayed sessions | T-05, T-08, T-10–T-12 | MAN-06 | HTTP logout replay probes; session-related integration tests |
| MC-03 — Untrusted-origin protected write | T-09 | — | HTTP origin and content-type rejection probes; cross-origin integration tests; ZAP 10202 triage |
| MC-04 — Temporary password and password change | T-13–T-16 | — | Authentication integration test suite; sensitive-data leakage checks |
| MC-05 — Restricted function access | T-19, T-26, T-43 | MAN-01, MAN-05, MAN-10, MAN-13 | HTTP role matrix; Admin and incident authorization integration tests |
| MC-06 — Unauthorized role changes | T-17, T-18, T-27 | MAN-03, MAN-04 | HTTP malformed-input and authorization probes |
| MC-07 — Out-of-scope incident access | T-24, T-25, T-28 | MAN-02 | Incident ownership and object-level authorization integration tests |
| MC-08 — Invalid or competing incident updates | T-26, T-27, T-31 | MAN-05, MAN-13 | Transaction-retry regression tests; load-test integrity checks |
| MC-09 — Unsafe stored text and settings | T-21–T-23, T-29, T-30 | MAN-07 | HTTP escaped-text and escaped-script probes; security-header tests; ZAP 10031 triage |
| MC-10 — Unsafe queries and error handling | T-38, T-55 | MAN-09 | Semgrep; unsafe-query lint restrictions; malformed-input probes; database outage and recovery verification |
| MC-11 — Audit integrity | T-33–T-35 | MAN-08 | Database audit mutation restrictions; restored audit protection; load-test audit consistency |
| MC-12 — Database and secrets exposure | T-52, T-53 | MAN-11, MAN-12 | Deployment verification; Gitleaks; sensitive-data leakage checks; CI configuration guards |
| MC-13 — Vulnerable dependencies and untrusted metadata | T-44, T-50 | — | Production dependency audit; pinned dependencies; proxy configuration review |

Detailed misuse-case outcomes and verification statuses are
documented in [Use and Misuse Cases](use-misuse-cases.md).

Supporting verification evidence is provided in the
[Slice 7 Verification Report](evidence/slice7/README.md),
its sanitized [results](evidence/slice7/results.json),
the manual testing matrix in Section 3.6, and the findings
register in Section 5.

#### Manual Verification Coverage Summary

| Metric | Result |
|---|---:|
| Total misuse cases | 13 |
| Misuse cases supported by manual verification | 9 |
| Misuse cases without dedicated manual verification | 4 |
| Manual misuse-case coverage | 69.2% |

All referenced manual security test cases passed within
their defined testing scope.

Manual verification coverage represents the proportion of
documented misuse cases supported by at least one dedicated
manual test. It does not represent the proportion of all
security requirements or threats that have been verified.

Additional verification evidence is provided through
automated integration testing, SAST, DAST, HTTP security
probes, and deployment verification.

### 4.2 Test Execution and Results

Security verification activities were executed against
identified application revisions in controlled testing
environments using synthetic accounts and incident data.

| Verification Activity | Result | Evidence |
|---|---|---|
| Manual security testing | 13/13 passed | Section 3.6; PR #65 |
| HTTP security probes | 151/151 passed | Slice 7 results; PR #63 |
| Unit testing | 110 passed | Slice 7 results; PR #63 |
| Database integration testing | 131 passed | Slice 7 results; PR #63 |
| Semgrep | 0 final findings | Section 1.4 |
| CodeQL | Successful execution | Section 1.4 |
| OWASP ZAP | Completed; findings triaged | Sections 2.4 and 5.1 |
| Production dependency audit | 0 reported vulnerabilities | Slice 7 results |
| Load testing | Final run passed configured thresholds | Slice 7 results |
| Backup restoration and recovery | Passed within tested scope | Slice 7 results |

Individual verification results are classified as:

- **Pass:** The implemented security control behaved as expected.
- **Fail:** Observed behavior violated the expected security requirement.
- **Blocked:** Testing could not proceed because of an implementation
  or environment dependency.
- **Not Tested:** The test was not executed.

A use or misuse case may be classified as **Partially Verified**
when passing evidence exists for one or more assertions but
complete verification of the documented scenario has not been
established.

Confirmed vulnerabilities, remediation decisions, and retest
results are documented in Section 5.1.

All eight High-risk STRIDE threats have at least one documented
passing verification activity, as summarized in Section 5.2.

The recorded results apply to their respective tested revisions
and verification environments. They do not establish exhaustive
security coverage or final release acceptance.

## 5. Findings register and High-threat verification (2026-11-25)

Every finding from the executed SAST, DAST, load, and manual testing, with its disposition. Severity uses the bug bar in `docs/sdl.md` (Practice #3). Raw results: `docs/evidence/slice7/README.md` and `results.json`. Compiled by the team's AI agent from the recorded evidence; the team confirms it in the final security review (Practice #15).

### 5.1 Findings

| ID | Source | Finding | Severity | Disposition | Evidence |
|---|---|---|---|---|---|
| F-01 | ZAP spider | Forms fell back to GET, so the login put credentials in the URL (ZAP 10024) | Medium | **Fixed**: all six forms declare POST; 10024 is absent from the final public scan | Evidence README F-01; `zap-public-final` |
| F-03 | k6 load test | Adapter write conflicts were not retried, so 0.73% of actions failed | Medium | **Fixed** in `f53b465` (`src/lib/tx.ts`); final run had zero errors | `tests/tx.test.ts`; `k6-summary` |
| F-02 | k6 diagnostic | 50 users behind one IP hit the 20-logins-per-15-minutes limit | Low | **Accepted**: the limit is a control (T-04); shared-NAT users can hit it | Evidence README F-02 |
| F-04 | Semgrep | Four unverified TLS contexts in Python test clients (not app code) | Low | **Fixed**: verified against the test CA; final Semgrep run has 0 findings | `semgrep` in `results.json` |
| Z-10202 | ZAP, all roles | Absence of anti-CSRF tokens | Medium (ZAP rating) | **False positive**: writes require a same-origin `Origin`, JSON content type, and a `SameSite=Strict` cookie (ASVS V3.5.1) | `tests/request.test.ts`; cross-origin test in `tests/db/admin-users.test.ts`; HTTP corpus |
| Z-90004 | ZAP, all roles | Cross-Origin-Embedder-Policy header missing | Low | **Recorded, not fixed**: the app uses no cross-origin-isolated features | Evidence README |
| Z-10044 | ZAP public | Big redirect body on `/` | Low | **No action**: on the live site the anonymous 307 to `/login` carries only the generic app shell (title and meta description), sent `no-store` | `curl https://107-23-118-127.sslip.io/`, 2026-11-25 |
| Z-10031 | ZAP user, admin | User-controllable HTML attribute (`categoryId`, `role`) | Informational | **No action**: React-escaped; the server validates UUID and enum values | HTTP corpus escaped-script probes; MAN-07 |
| Z-info | ZAP | 10109, 10049, 10015, 10111 (app type, caching, auth request) | Informational | **No action**: protected responses are `no-store` by design; static assets are cacheable | `tests/security-headers.test.ts` |

No-finding results on the same date: Semgrep 1.185.0, 0 findings in 171 files; GitHub code scanning (CodeQL), 0 alerts (none open, dismissed, or fixed); `npm audit --omit=dev`, 0; HTTP corpus, 151 of 151 pass; manual tests MAN-01 to MAN-13, all PASS.

**Open High or Critical findings: none. Open Medium findings: none** (two fixed, one false positive).

Limits: ZAP ran passive and spider scans locally, not an active scan and not against the live site. The live site was checked with port, TLS, header, and role tests (`docs/deployment.md` Results).

### 5.2 High threats and their tests

| Threat | Mitigation | Passing tests or checks |
|---|---|---|
| T-01 brute force on login | Per-account lockout, per-IP limit, argon2id | `tests/db/auth.test.ts` ("locks an account after repeated failures…", "limits attempts per IP before hashing") |
| T-19 vertical privilege escalation | Role checked in every handler and page | `tests/db/admin-users.test.ts` (401/403 on every admin route), `tests/db/incidents.test.ts` (role rejections), HTTP corpus role matrix; MAN-01, MAN-05, MAN-10 |
| T-24 IDOR on incidents | Object-level checks in the query; same 404 for missing and forbidden | `tests/db/incidents.test.ts` ("does not expose another reporter's incidents", "returns 404 when a reporter requests another reporter's incident"); MAN-02 |
| T-29 stored XSS | React escaping, `dangerouslySetInnerHTML` banned, CSP with nonce | `tests/lint-bans.test.ts`, `tests/security-headers.test.ts`, HTTP corpus escaped-script probes; MAN-07 |
| T-38 SQL injection | ORM and tagged templates only; raw unsafe APIs banned; UUID and enum schemas | `tests/lint-bans.test.ts`, schema tests in `tests/admin/users.test.ts`, HTTP malformed-input corpus, Semgrep 0; MAN-09 |
| T-44 framework vulnerability | Pinned versions, Dependabot, `npm audit` gate | `npm audit --omit=dev` 0 in `make check`; Dependabot config (`.github/dependabot.yml`) |
| T-52 database exposed | No `ports:` on the database; only 80 and 443 open on the host | `tests/ci-guards.test.ts`; live port scans in `docs/deployment.md` Results; MAN-11 |
| T-53 plaintext credentials | dotenvx-encrypted `.env`, key in Secrets Manager, gitleaks | `gitleaks` CI job; `scripts/live-up.sh` key checks; on-host key checks in `docs/deployment.md` Results; MAN-12 |

All eight High threats have a mitigation and at least one passing test or recorded check.

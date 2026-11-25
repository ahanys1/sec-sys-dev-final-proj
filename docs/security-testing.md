# SAST, DAST, and Manual Security Testing

Team #13

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#9-acceptance-criteria)

Status: Local SAST, DAST, and integrated verification results are documented in the [Slice 7 report](evidence/slice7/README.md) and its sanitized `results.json` (PR #63). Independent manual security testing results are documented in Section 3 (PR #65). The results apply to their respective tested application revisions and documented testing scopes. Live scans and final release acceptance are not claimed.

## 1. Static Application Security Testing (SAST)

### 1.1 Objective

Static Application Security Testing (SAST) will be performed to identify potentially insecure coding patterns in the incident-reporting application's Next.js and TypeScript source code. The analysis will focus on vulnerabilities identified in the STRIDE threat model, particularly injection, cross-site scripting, improper authorization, sensitive information exposure, and security weaknesses introduced through AI-assisted development.

The purpose of SAST is to identify potential vulnerabilities early, review whether the implementation follows the team's documented security design, and provide evidence for remediation and verification.

### 1.2 Tools and Methodology

Semgrep is proposed as the primary security-focused static analysis tool. ESLint and TypeScript checks will supplement the analysis, while dependency vulnerability scanning (`npm audit`) and secret scanning will be recorded as separate activities.

The team will:

1. Run Semgrep against the application source code using applicable TypeScript, JavaScript, and security rules.
2. Review findings against the STRIDE threat model and the security requirements.
3. Inspect relevant source code to distinguish actionable findings from false positives.
4. Record the affected file, threat reference, severity, remediation, and verification result.
5. Repeat analysis after remediation and against the integrated application before final submission.

### 1.3 Threat-Based Analysis Priorities

The following threats will guide source-code inspection:

- **T-29 — Stored XSS:** Identify unsafe HTML rendering and violations of the plain-text rendering design.
- **T-38 — SQL Injection:** Identify dynamically constructed SQL statements and prohibited unsafe query methods.
- **T-17/T-19 — Mass Assignment and Privilege Escalation:** Review request validation and server-side authorization patterns.
- **T-33 — Audit Log Tampering:** Inspect application code for prohibited audit modification operations and review database permission definitions.
- **T-43/T-45 — Framework Authorization Bypass:** Identify reliance on middleware for authorization and any unintended Server Actions.
- **T-53 — Secrets Exposure:** Inspect source and configuration for hardcoded credentials or improperly stored secrets.
- **T-60 — AI-Generated Code Vulnerabilities:** Review generated code for insecure patterns, omitted controls, and deviations from established design decisions.

Where a required control cannot be reliably verified through static analysis, the corresponding threat will be assigned to automated integration, DAST, or manual security testing.

### 1.4 Results and Evidence

*Pending SAST execution.*

The team will record the scanner version, ruleset, scanned commit, findings, false positives, remediation decisions, and subsequent verification results.

### 1.5 Limitations

SAST cannot demonstrate that the application correctly enforces every security requirement at runtime. Missing authorization checks, improper role permissions, session behavior, and database access restrictions may require additional testing. SAST findings will therefore be evaluated alongside DAST, manual security testing, and the final threat model review.

## 2. Dynamic Application Security Testing (DAST)

### 2.1 Objective

Dynamic Application Security Testing (DAST) will be performed against the running incident-reporting application to identify security vulnerabilities observable through HTTP requests and responses. Unlike SAST, which examines source code, DAST evaluates the application's behavior from an external perspective.

Testing will focus on the authentication and session mechanisms, access restrictions, input handling, security headers, and API endpoints identified in the STRIDE threat model. DAST will help determine whether the implemented application enforces the security controls specified during the design phase.

### 2.2 Tools and Methodology

OWASP ZAP is proposed as the primary DAST tool for assessing the running Next.js application. Testing will be performed against an isolated local or staging environment using non-production accounts and test data.

The team will:

1. Start the application in a controlled testing environment and record the tested version or commit.
2. Configure ZAP to target only the authorized application address and discover accessible pages and API endpoints.
3. Perform an initial passive or baseline scan to identify potential information disclosure, insecure HTTP headers, cookie configuration issues, and other observable weaknesses.
4. Configure authenticated testing for the User, Reviewer, and Admin roles, where supported, to examine protected application functionality.
5. Perform targeted active scans against appropriate endpoints to investigate injection, cross-site scripting, and other relevant vulnerabilities.
6. Review findings to distinguish confirmed vulnerabilities from false positives, document remediation, and repeat relevant tests after corrections.

Active scanning will be restricted to the controlled testing environment because automated requests may create, modify, or delete application data.

### 2.3 Threat-Based Testing Priorities

DAST activities will be guided by the STRIDE analysis and its identified entry points:

- **T-01 — Brute Force:** Evaluate login rate limiting and account lockout behavior using controlled requests.
- **T-08/T-09 — Session Replay and CSRF:** Examine session invalidation and protection against unauthorized cross-origin state-changing requests.
- **T-17/T-19 — Mass Assignment and Privilege Escalation:** Evaluate whether unauthorized request fields and restricted API operations are rejected.
- **T-24 — Insecure Direct Object References:** Test whether changing incident identifiers allows access to records outside the requesting user's permissions.
- **T-29 — Stored XSS:** Examine how user-supplied incident data and comments are rendered.
- **T-33 — Audit Log Tampering:** Examine whether exposed application interfaces permit unauthorized audit modification.
- **T-38 — SQL Injection:** Assess applicable input parameters for unsafe database query behavior.
- **T-43 — Middleware Authorization Bypass:** Verify that crafted requests cannot bypass authentication or authorization controls.
- **T-49 — Security Headers:** Inspect security headers across application pages, API responses, and error responses.

Authorization, session management, and business-logic tests requiring precise role or application-state knowledge will be supplemented by manual and automated integration testing.

### 2.4 Results and Evidence

*Pending execution of DAST.*

The team will record the ZAP version, scan configuration, target environment, tested commit, authentication context, identified findings, and verification results. Findings will be cross-referenced with applicable security requirements and STRIDE threat identifiers.

Evidence will include relevant HTTP requests and responses, scanner reports, remediation references, and repeat-test results where applicable. Sensitive information will be excluded or redacted from submitted evidence.

### 2.5 Limitations

DAST evaluates application behavior through exposed interfaces and may not identify vulnerabilities in code paths or components that are not exercised during testing. Automated scanners may also fail to recognize application-specific authorization requirements, business-logic weaknesses, or database-level permission issues.

Therefore, DAST results will be supplemented with SAST, automated integration tests, and manual security testing. A scan reporting no vulnerabilities will not be interpreted as proof that the application is secure.

## 3. Manual Security Testing

### 3.1 Objective

Manual security testing was performed to evaluate application-specific security controls that cannot be fully verified through automated static or dynamic analysis. Testing will focus on authentication, role-based access control, incident ownership, session management, audit logging, input handling, and deployment security.

The objective is to determine whether the implemented application enforces the permissions, restrictions, and security requirements defined during the design phase. Particular attention will be given to high-risk threats identified in the STRIDE analysis and potential security weaknesses introduced through AI-assisted development.

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

Manual testing will prioritize the following scenarios:

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
was observed during testing.1

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
verification methods, and completed manual security test cases.
This mapping provides traceability between identified threats,
expected security controls, and verification activities.

Testing methods may overlap because individual threats can require
multiple forms of verification. SAST and DAST supplement, rather
than replace, automated integration and manual security testing.

| Misuse Case | STRIDE Threats | Verification Methods | Manual Test References | Status |
|---|---|---|---|---|
| MC-01 — Failed sign-ins and enumeration | T-01–T-04 | DAST, automated authentication tests | — | Planned |
| MC-02 — Invalid or replayed sessions | T-05, T-08, T-10–T-12 | DAST, automated session tests, manual verification | MAN-06 | Partially Verified |
| MC-03 — Untrusted-origin protected write | T-09 | DAST, automated origin/CSRF tests | — | Planned |
| MC-04 — Temporary password and password change | T-13–T-16 | Automated authentication tests, manual verification | — | Planned |
| MC-05 — Restricted function access | T-19, T-26, T-43 | DAST, automated role matrix, manual authorization tests | MAN-01, MAN-05, MAN-10, MAN-13 | Partially Verified |
| MC-06 — Unauthorized role changes | T-17, T-18, T-27 | Automated validation and authorization tests, manual verification | MAN-03, MAN-04 | Partially Verified |
| MC-07 — Out-of-scope incident access | T-24, T-25, T-28 | DAST, automated object-level authorization tests, manual IDOR tests | MAN-02 | Partially Verified |
| MC-08 — Invalid or competing incident updates | T-26, T-27, T-31 | Automated workflow/concurrency tests, manual verification | MAN-05, MAN-13 | Partially Verified |
| MC-09 — Unsafe stored text and settings | T-21–T-23, T-29, T-30 | SAST, DAST, automated validation tests, manual rendering tests | MAN-07 | Partially Verified |
| MC-10 — Unsafe queries and error handling | T-38, T-55 | SAST, DAST, automated validation tests, manual verification | MAN-09 | Partially Verified |
| MC-11 — Audit integrity | T-33–T-35 | Automated database/integration tests, manual application and database verification | MAN-08 | Partially Verified |
| MC-12 — Database and secrets exposure | T-52, T-53 | Deployment configuration review, network verification, secret scanning | MAN-11, MAN-12 | Partially Verified |
| MC-13 — Vulnerable dependencies and untrusted metadata | T-44, T-50 | Dependency scanning (SCA), automated configuration tests | — | Planned |

#### Manual Verification Coverage Summary

| Metric | Result |
|---|---:|
| Total misuse cases | 13 |
| Misuse cases supported by manual verification | 9 |
| Misuse cases without dedicated manual verification | 4 |
| Manual misuse-case coverage | 69.2% |

All referenced manual security test cases passed within their
defined testing scope. A status of Partially Verified indicates
that manual testing provides supporting evidence for one or more
associated security controls, but does not establish complete
verification of every threat associated with the misuse case.

The remaining verification activities and overall misuse-case
statuses will be reconciled with automated integration testing,
SAST, DAST, and deployment verification results.

### 4.2 Test Execution and Results

Testing results will be recorded as the application reaches a functional and testable state. Each completed test will reference the applicable misuse case, STRIDE threat, security requirement, and supporting evidence.

Results will be classified as:

- **Pass:** The implemented security control behaved as expected.
- **Fail:** Observed behavior violated the expected security requirement.
- **Blocked:** Testing could not proceed because of an implementation or environment dependency.
- **Not Tested:** The test has not been executed.

The team will record the tested application version or commit, environment, test procedure, expected result, observed result, and evidence location. Confirmed vulnerabilities will include remediation references and subsequent retest results.

The traceability matrix will be reviewed against the finalized STRIDE analysis, use/misuse cases, and implemented application before submission. All High-risk threats must have an appropriate verification activity, including threats addressed through dependency scanning or deployment configuration checks rather than application-level SAST or DAST.
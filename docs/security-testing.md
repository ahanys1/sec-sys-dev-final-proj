# SAST, DAST, and Manual Security Testing

Team #__

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#9-acceptance-criteria)

Status: Draft - SAST execution and results pending.

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
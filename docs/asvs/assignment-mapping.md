# Assignment Requirements Mapping

Master list of the security requirements from [ASSIGNMENT.md](../../ASSIGNMENT.md), mapped to ASVS 5.0.0 IDs. **These are mandatory and take precedence over ASVS**: where an assignment requirement is stricter or more specific, it wins. Read this file before any security work. Status: `TODO` / `Done` / `N/A: reason`; `Done` requires evidence (file path or test name).

Text below is quoted from ASSIGNMENT.md (sub-bullets joined with `;`). SR-15 does not exist in the source.

| Req | Text | ASVS IDs | Status | Evidence |
|---|---|---|---|---|
| SR-1 | The system shall require authentication for all non-public endpoints. | V8.2.1, V8.3.1, V7.2.1 | TODO | |
| SR-2 | Passwords shall be stored using an established and secure algorithm. | V11.4.2 | TODO | |
| SR-3 | If web-based, authentication tokens (e.g. session cookies) shall be protected using secure flags (HttpOnly, Secure, SameSite). | V3.3.1, V3.3.2, V3.3.4 | TODO | |
| SR-4 | The system shall enforce RBAC for user, reviewer, and admin roles. | V8.1.1, V8.2.1, V8.2.2 | TODO | |
| SR-5 | Authorization checks shall be performed for every request. | V8.2.1, V8.2.2, V8.3.1 | TODO | |
| SR-6 | Users shall not be able to modify their own roles. | V8.2.1, V8.2.3, V15.3.3 | TODO | |
| SR-7 | All user input shall be validated and sanitized. | V2.2.1, V2.2.2, V1.2.1, V3.2.2, V15.3.5 | TODO | |
| SR-8 | The system shall use parameterized queries for all database operations. | V1.2.4 | TODO | |
| SR-9 | Logs shall not contain sensitive data (passwords, tokens, full incident descriptions). | V16.2.5, V14.1.2 | TODO | |
| SR-10 | Audit logs shall include user ID, timestamp, action, and target ID. | V16.2.1 | TODO | |
| SR-11 | Logs shall be protected from tampering. | V16.4.1, V16.4.2, V16.4.3 | TODO | |
| SR-12 | Error messages shall not reveal queries. | V16.5.1 | TODO | |
| SR-13 | Detailed errors shall be logged. | V16.3.4 | TODO | |
| SR-14 | Secrets (DB credentials) shall not be stored in an unencrypted mode. | V13.3.1, V13.3.2 | TODO | |
| SR-16 | The system shall protect against: Sensitive data exposure; Security misconfiguration; Insufficient logging & monitoring | V14.2.1, V14.3.2, V12.2.1, V13.4.1, V13.4.2, V3.4.1, V3.4.4, V16.3.1, V16.3.2, V16.3.3 | TODO | |
| FR-11 | The system shall log all key actions, including: Incident creation; Incident status changes; Comment creation; User creation, role changes, and deactivation; Password changes | V16.3.1, V16.3.3 | TODO | |
| FR-12 | Audit logs shall be immutable and append-only. | V16.4.2 | TODO | |
| NFR-2 | Error messages shall be user-friendly and not reveal internal details. | V16.5.1 | TODO | |

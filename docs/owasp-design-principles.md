# OWASP Security by Design Principles

Team #__

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#submission-requirements)

**Status:** Design phase. Controls and verification below are planned, not claims of completed implementation or testing. Requirement references were checked against `ASSIGNMENT.md`; the ten headings and their order match Lesson 17, slide 26.

### 1. Minimize Attack Surface Area

The principle of minimizing attack surface area focuses on reducing the number of potential entry points and exposed components that an attacker could exploit. For our incident-reporting application, this principle will be addressed by limiting exposed routes, services, and framework features in the planned Next.js monolith. Authentication and server-side role-based authorization will protect the remaining functionality. Public access will be restricted to necessary functions, such as the login page, while incident submission, review, and administrative operations will require authenticated sessions and appropriate permissions. Database operations will be performed server-side rather than exposing direct database access to the client. Additionally, unnecessary endpoints, services, and development functionality will be excluded from the production deployment to reduce potential attack vectors.

**Related Security Requirements:** SR-1 (Authentication), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization).

**Verification:** The team will review exposed application routes and deployment configurations to identify unnecessary entry points. Manual security testing will verify that unauthenticated users cannot access protected functionality and that authenticated users cannot invoke operations outside their assigned roles.

### 2. Establish Secure Defaults

The principle of establishing secure defaults ensures that the application operates with restrictive security settings unless explicitly authorized otherwise. For our incident-reporting application, this principle will be addressed by requiring authentication for protected functionality and denying access when valid permissions cannot be established. Accounts will be created by Administrators, with elevated roles assigned only through authorized administrative actions. Missing or invalid roles will not grant access. Session cookies will use appropriate security attributes, including HttpOnly, Secure, and SameSite=Strict, as specified by the selected session design, to reduce the risk of unauthorized session access or misuse. These defaults are intended to prevent unnecessary exposure of application functionality and ensure that security protections are enabled from the beginning.

**Related Security Requirements:** SR-1 (Authentication), SR-3 (Secure Session Management), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-6 (Role Modification Restrictions).

**Verification:** The team will verify that protected routes reject unauthenticated requests, missing or invalid roles do not grant elevated privileges, and session cookies use the intended security attributes. Manual authorization tests will also confirm that access is denied when a user's permissions are insufficient.

### 3. Principle of Least Privilege (POLP)

The principle of least privilege ensures that users and system components receive only the permissions necessary to perform their intended functions. For our incident-reporting application, this principle will be addressed through role-based access control (RBAC), with explicitly defined permissions for Users, Reviewers, and Administrators. Each role will be restricted to its assigned responsibilities, with authorization enforced server-side for every protected operation rather than relying on frontend controls. All users, including Administrators, will be prohibited from modifying their own roles to prevent unauthorized privilege escalation. Additionally, database access will be restricted to the permissions required by the application, reducing the potential impact of compromised credentials or components.

**Related Security Requirements:** SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-6 (Role Modification Restrictions).

**Verification:** Manual authorization testing will attempt restricted operations using accounts assigned to each role. The team will verify that unauthorized requests are rejected, permitted operations function correctly, and database permissions do not exceed those required by the application.

### 4. The Principle of Defense in Depth

The principle of defense in depth emphasizes using multiple layers of security controls so that the failure or compromise of one mechanism does not necessarily compromise the entire system. For our incident-reporting application, this principle will be addressed through a combination of authentication, secure session management, role-based access control (RBAC), input validation, and parameterized database queries. Authentication will establish user identity, while server-side authorization will independently verify permissions for protected operations. Input validation and database protections will further reduce the risk of malicious data affecting application functionality or integrity. Additionally, audit logging and secure error handling will support the detection and investigation of security-related events. Together, these controls are intended to reduce reliance on any single security mechanism.

**Related Security Requirements:** SR-1–SR-8 (Authentication, Password and Session Protection, Authorization, Input Validation, and Parameterized Queries), SR-9–SR-11 (Logging Protections), SR-12–SR-13 (Error Handling).

**Verification:** The team will conduct layered security testing to verify the contribution of each control and their combined behavior. Tests will include unauthorized requests using authenticated accounts, malformed or malicious input submissions, attempts to manipulate database operations, and verification that security-relevant actions are appropriately logged without exposing sensitive information.

### 5. Fail Securely

The principle of failing securely ensures that application errors and unexpected conditions do not result in weakened security controls or unauthorized access. For our incident-reporting application, this principle will be addressed by denying operations when authentication or authorization checks fail, rejecting invalid input, and handling database or application errors without exposing sensitive information. Error responses will provide appropriate feedback to users while preventing the disclosure of internal system details, such as database queries, credentials, or stack traces. Status and settings updates are planned to use transactions with their audit records. Transaction coverage and audit-write failure behavior for the remaining required actions still need to be documented and tested; data integrity and mandatory auditing must be preserved when failures occur. Detailed server-side errors must also exclude passwords, tokens, and full incident descriptions (SR-9). These measures will help the application recover from errors without compromising its security requirements.

**Related Security Requirements:** SR-5 (Server-Side Authorization), SR-7 (Input Validation), SR-9–SR-11 (Audit Logging), SR-12 (No Queries in Error Messages), SR-13 (Detailed Server-Side Error Logging). Supporting requirements: FR-11–FR-12 (Required, Append-Only Audit Trail), NFR-2, NFR-5, NFR-6 (Safe Errors, Concurrent Data Integrity, and Graceful Recovery).

**Verification:** The team will test invalid sessions, unauthorized requests, malformed input, and simulated application or database failures. Testing will verify that operations are rejected appropriately, sensitive information is not disclosed, and failed operations do not leave unauthorized or inconsistent changes in the database. Tests will include audit-write failures and concurrent updates against the documented failure policy.

### 6. Don't Trust Services

The principle of not trusting services emphasizes that external and internal services should not be assumed secure simply because they are part of the application's architecture. For our incident-reporting application, this principle will be addressed by treating interactions between the Next.js application, PostgreSQL database, and third-party dependencies as trust boundaries. Third-party dependencies and AI-generated code will be reviewed as supply-chain inputs, rather than assumed trustworthy. Client-submitted data will be validated server-side, while database operations will use parameterized queries and restricted credentials to reduce the risk of injection and unauthorized data access. The application will also validate security-sensitive values, such as user roles, rather than blindly accepting unexpected data. Third-party dependencies will be reviewed for known vulnerabilities, and failures or unexpected responses from dependent components will be handled securely.

SR-14 prohibits unencrypted storage of database credentials. Keeping plaintext secrets in an ignored `.env` file does not satisfy that requirement. The local encrypted-storage and key-handling mechanism remains open (threat-model D-4); AWS Secrets Manager is a future deployment option, not an implemented control.

**Related Security Requirements:** SR-5 (Server-Side Authorization), SR-7 (Input Validation), SR-8 (Parameterized Queries), SR-14 (No Unencrypted Secret Storage).

**Verification:** The team will review database access permissions, test malformed and unexpected input, verify that invalid role values cannot grant elevated access, and conduct dependency vulnerability assessments. Testing will also confirm that failures in dependent components do not bypass authorization controls or expose sensitive information.

### 7. Separation of Duties

The principle of separation of duties emphasizes dividing sensitive responsibilities among different roles to reduce the risk of unauthorized actions, misuse of privileges, and conflicts of interest. For our incident-reporting application, this principle will be addressed through the separation of responsibilities among Users, Reviewers, and Administrators. Users will be responsible for submitting incidents, Reviewers for managing incident reviews and status updates, and Administrators for managing user accounts, role assignments, and system configuration. Administrators will also view all incidents and add comments, as required by FR-9 and FR-10. The current design reserves incident status changes and classification for Reviewers; Admin is not an unrestricted super-role. These responsibilities will be enforced through server-side role-based authorization to prevent users from performing operations outside their assigned roles. This supports role-based separation of responsibilities, but does not establish independent approval or prevent self-review or multiple accounts held by one person; those would need additional explicit controls. No application role should be able to alter audit history, although protection against privileged database operators requires separate consideration.

**Related Security Requirements:** SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-6 (Role Modification Restrictions).

**Verification:** The team will test each role's permitted and restricted operations to verify that responsibilities are appropriately separated. Tests will include attempts by Users and Reviewers to perform administrative actions, as well as attempts to modify roles without authorization (including administrator self-role changes). Tests will preserve permitted administrator viewing/commenting, reject administrator status changes, and check audit-log modification restrictions. Supporting requirements: FR-9–FR-12 and SR-11.

### 8. Avoid Security by Obscurity

The principle of avoiding security by obscurity emphasizes that application security should not depend on hiding implementation details, endpoints, or system functionality from potential attackers. For our incident-reporting application, this principle will be addressed through explicit authentication, server-side authorization, and input validation rather than relying on concealed administrative pages or hidden interface elements. Administrative and reviewer functionality will require appropriate role permissions regardless of whether the corresponding routes or controls are visible in the user interface. Additionally, sensitive credentials and configuration values will be protected through encrypted storage and controlled access rather than relying on undisclosed file locations or naming conventions; the local mechanism remains an open design decision (D-4). These measures are intended to ensure that application security remains effective even when an attacker understands the system's structure.

**Related Security Requirements:** SR-1 (Authentication), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-14 (No Unencrypted Secret Storage).

**Verification:** The team will attempt to access protected routes and invoke restricted operations directly through HTTP requests, bypassing normal frontend navigation. Testing will verify that unauthorized requests are rejected regardless of endpoint visibility and that sensitive configuration values are not exposed to the client.

### 9. Keep Security Simple

The principle of keeping security simple emphasizes minimizing unnecessary complexity in security mechanisms to reduce implementation errors, configuration mistakes, and maintenance difficulties. For our incident-reporting application, this principle will be addressed through a modular Next.js architecture and consistent security controls for authentication, authorization, and input validation. Rather than duplicating security logic throughout the application, reusable server-side functions will be used to enforce role permissions and validate protected operations. The application will also avoid unnecessary services, authentication mechanisms, and architectural components that could introduce additional security risks. These design decisions are intended to make security controls easier to understand, test, and maintain while preserving the protections required by the application.

**Related Security Requirements:** SR-1 (Authentication), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-7 (Input Validation).

**Verification:** The team will review the implementation for duplicated or inconsistent security logic, verify that protected operations use the intended authorization mechanisms, and conduct security tests to confirm that simplified controls still enforce all required restrictions.

### 10. Fix Security Issues Correctly

The principle of fixing security issues correctly emphasizes identifying and addressing the underlying causes of vulnerabilities rather than applying temporary or isolated solutions. For our incident-reporting application, this principle will be addressed through security testing, code review, and systematic remediation of identified weaknesses. When a vulnerability is discovered, the team will investigate its root cause, determine whether similar weaknesses exist elsewhere in the application, and implement a correction that addresses the broader issue. Particular attention will be given to authentication, authorization, input validation, and database operations, where inconsistent implementations could introduce recurring vulnerabilities. Security fixes will be retested, and regression tests will be added where practical to help prevent previously identified issues from reappearing.

**Related Security Requirements:** SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-7 (Input Validation), SR-8 (Parameterized Queries), SR-16 (Sensitive Data Exposure, Security Misconfiguration, and Insufficient Logging/Monitoring). Supporting criteria: AC-2–AC-4 (Security Validation, SAST/DAST/Manual Testing, and Lifecycle/AI Documentation). SR-16 names those specific risks rather than a general remediation process.

**Verification:** The team will document identified vulnerabilities, their underlying causes, and the corrective actions taken. Security testing will be repeated after remediation to verify that the original vulnerability is resolved and that similar weaknesses are not present in related functionality. Regression testing will also be used to confirm that corrections do not introduce new functional or security issues. The team will record relevant changes to AI-generated output and their security rationale in the AI usage report.
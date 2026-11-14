# OWASP Security by Design Principles

Team #__

Spec: [ASSIGNMENT.md](../ASSIGNMENT.md#submission-requirements)

TODO

### 1. Minimize Attack Surface Area

The principle of minimizing attack surface area focuses on reducing the number of potential entry points and exposed components that an attacker could exploit. For our incident-reporting application, this principle will be addressed through a modular Next.js architecture that limits access to application functionality based on authentication and role-based authorization. Public access will be restricted to necessary functions, such as the login page, while incident submission, review, and administrative operations will require authenticated sessions and appropriate permissions. Database operations will be performed server-side rather than exposing direct database access to the client. Additionally, unnecessary endpoints, services, and development functionality will be excluded from the production deployment to reduce potential attack vectors.

**Related Security Requirements:** SR-1 (Authentication), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization).

**Verification:** The team will review exposed application routes and deployment configurations to identify unnecessary entry points. Manual security testing will verify that unauthenticated users cannot access protected functionality and that authenticated users cannot invoke operations outside their assigned roles.

### 2. Establish Secure Defaults

The principle of establishing secure defaults ensures that the application operates with restrictive security settings unless explicitly authorized otherwise. For our incident-reporting application, this principle will be addressed by requiring authentication for protected functionality and denying access when valid permissions cannot be established. Newly created accounts will receive the lowest appropriate privilege level, with elevated roles assigned only through authorized administrative actions. Session cookies will use appropriate security attributes, including HttpOnly, Secure in HTTPS deployments, and SameSite, to reduce the risk of unauthorized session access or misuse. These defaults are intended to prevent unnecessary exposure of application functionality and ensure that security protections are enabled from the beginning.

**Related Security Requirements:** SR-1 (Authentication), SR-3 (Secure Session Management), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-6 (Role Modification Restrictions).

**Verification:** The team will verify that protected routes reject unauthenticated requests, newly created accounts do not receive elevated privileges by default, and session cookies use the intended security attributes. Manual authorization tests will also confirm that access is denied when a user's permissions are insufficient.

### 3. Principle of Least Privilege (POLP)

The principle of least privilege ensures that users and system components receive only the permissions necessary to perform their intended functions. For our incident-reporting application, this principle will be addressed through role-based access control (RBAC), with explicitly defined permissions for Users, Reviewers, and Administrators. Each role will be restricted to its assigned responsibilities, with authorization enforced server-side for every protected operation rather than relying on frontend controls. Users will also be prohibited from modifying their own roles to prevent unauthorized privilege escalation. Additionally, database access will be restricted to the permissions required by the application, reducing the potential impact of compromised credentials or components.

**Related Security Requirements:** SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-6 (Role Modification Restrictions).

**Verification:** Manual authorization testing will attempt restricted operations using accounts assigned to each role. The team will verify that unauthorized requests are rejected, permitted operations function correctly, and database permissions do not exceed those required by the application.

### 4. The Principle of Defense in Depth

The principle of defense in depth emphasizes using multiple layers of security controls so that the failure or compromise of one mechanism does not necessarily compromise the entire system. For our incident-reporting application, this principle will be addressed through a combination of authentication, secure session management, role-based access control (RBAC), input validation, and parameterized database queries. Authentication will establish user identity, while server-side authorization will independently verify permissions for protected operations. Input validation and database protections will further reduce the risk of malicious data affecting application functionality or integrity. Additionally, audit logging and secure error handling will support the detection, investigation, and containment of security-related events. Together, these controls are intended to reduce reliance on any single security mechanism.

**Related Security Requirements:** SR-1–SR-13, particularly those addressing authentication, session management, authorization, input validation, database security, audit logging, and error handling.

**Verification:** The team will conduct layered security testing to confirm that controls operate independently. Tests will include unauthorized requests using authenticated accounts, malformed or malicious input submissions, attempts to manipulate database operations, and verification that security-relevant actions are appropriately logged without exposing sensitive information.

### 5. Fail Securely

The principle of failing securely ensures that application errors and unexpected conditions do not result in weakened security controls or unauthorized access. For our incident-reporting application, this principle will be addressed by denying operations when authentication or authorization checks fail, rejecting invalid input, and handling database or application errors without exposing sensitive information. Error responses will provide appropriate feedback to users while preventing the disclosure of internal system details, such as database queries, credentials, or stack traces. Sensitive operations will also be designed to preserve data integrity when failures occur, including preventing partially completed updates and ensuring required audit records are maintained. These measures will help the application recover from errors without compromising its security requirements.

**Related Security Requirements:** SR-5 (Server-Side Authorization), SR-7 (Input Validation), SR-9–SR-11 (Audit Logging), SR-12–SR-13 (Secure Error Handling).

**Verification:** The team will test invalid sessions, unauthorized requests, malformed input, and simulated application or database failures. Testing will verify that operations are rejected appropriately, sensitive information is not disclosed, and failed operations do not leave unauthorized or inconsistent changes in the database.

### 6. Don't Trust Services

The principle of not trusting services emphasizes that external and internal services should not be assumed secure simply because they are part of the application's architecture. For our incident-reporting application, this principle will be addressed by treating interactions between the Next.js application, PostgreSQL database, and third-party dependencies as potential security boundaries. Client-submitted data will be validated server-side, while database operations will use parameterized queries and restricted credentials to reduce the risk of injection and unauthorized data access. The application will also validate security-sensitive values, such as user roles, rather than blindly accepting unexpected data. Third-party dependencies will be reviewed for known vulnerabilities, and failures or unexpected responses from dependent components will be handled securely.

**Related Security Requirements:** SR-5 (Server-Side Authorization), SR-7 (Input Validation), SR-8 (Parameterized Queries), SR-14 (Credential and Secret Protection).

**Verification:** The team will review database access permissions, test malformed and unexpected input, verify that invalid role values cannot grant elevated access, and conduct dependency vulnerability assessments. Testing will also confirm that failures in dependent components do not bypass authorization controls or expose sensitive information.

### 7. Separation of Duties

The principle of separation of duties emphasizes dividing sensitive responsibilities among different roles to reduce the risk of unauthorized actions, misuse of privileges, and conflicts of interest. For our incident-reporting application, this principle will be addressed through the separation of responsibilities among Users, Reviewers, and Administrators. Users will be responsible for submitting incidents, Reviewers for managing incident reviews and status updates, and Administrators for managing user accounts and role assignments. These responsibilities will be enforced through server-side role-based authorization to prevent users from performing operations outside their assigned roles. This separation is intended to reduce the concentration of sensitive capabilities within individual roles and limit opportunities for privilege misuse.

**Related Security Requirements:** SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-6 (Role Modification Restrictions).

**Verification:** The team will test each role's permitted and restricted operations to verify that responsibilities are appropriately separated. Tests will include attempts by Users and Reviewers to perform administrative actions, as well as attempts to modify roles without authorization.

### 8. Avoid Security by Obscurity

The principle of avoiding security by obscurity emphasizes that application security should not depend on hiding implementation details, endpoints, or system functionality from potential attackers. For our incident-reporting application, this principle will be addressed through explicit authentication, server-side authorization, and input validation rather than relying on concealed administrative pages or hidden interface elements. Administrative and reviewer functionality will require appropriate role permissions regardless of whether the corresponding routes or controls are visible in the user interface. Additionally, sensitive credentials and configuration values will be protected through appropriate secret management rather than relying on undisclosed file locations or naming conventions. These measures are intended to ensure that application security remains effective even when an attacker understands the system's structure.

**Related Security Requirements:** SR-1 (Authentication), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-14 (Credential and Secret Protection).

**Verification:** The team will attempt to access protected routes and invoke restricted operations directly through HTTP requests, bypassing normal frontend navigation. Testing will verify that unauthorized requests are rejected regardless of endpoint visibility and that sensitive configuration values are not exposed to the client.

### 9. Keep Security Simple

The principle of keeping security simple emphasizes minimizing unnecessary complexity in security mechanisms to reduce implementation errors, configuration mistakes, and maintenance difficulties. For our incident-reporting application, this principle will be addressed through a modular Next.js architecture and consistent security controls for authentication, authorization, and input validation. Rather than duplicating security logic throughout the application, reusable server-side functions will be used to enforce role permissions and validate protected operations. The application will also avoid unnecessary services, authentication mechanisms, and architectural components that could introduce additional security risks. These design decisions are intended to make security controls easier to understand, test, and maintain while preserving the protections required by the application.

**Related Security Requirements:** SR-1 (Authentication), SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-7 (Input Validation).

**Verification:** The team will review the implementation for duplicated or inconsistent security logic, verify that protected operations use the intended authorization mechanisms, and conduct security tests to confirm that simplified controls still enforce all required restrictions.

### 10. Fix Security Issues Correctly

The principle of fixing security issues correctly emphasizes identifying and addressing the underlying causes of vulnerabilities rather than applying temporary or isolated solutions. For our incident-reporting application, this principle will be addressed through security testing, code review, and systematic remediation of identified weaknesses. When a vulnerability is discovered, the team will investigate its root cause, determine whether similar weaknesses exist elsewhere in the application, and implement a correction that addresses the broader issue. Particular attention will be given to authentication, authorization, input validation, and database operations, where inconsistent implementations could introduce recurring vulnerabilities. Security fixes will be retested, and regression tests will be added where practical to help prevent previously identified issues from reappearing.

**Related Security Requirements:** SR-4 (Role-Based Access Control), SR-5 (Server-Side Authorization), SR-7 (Input Validation), SR-8 (Parameterized Queries), SR-16 (OWASP Risk Mitigation).

**Verification:** The team will document identified vulnerabilities, their underlying causes, and the corrective actions taken. Security testing will be repeated after remediation to verify that the original vulnerability is resolved and that similar weaknesses are not present in related functionality. Regression testing will also be used to confirm that corrections do not introduce new functional or security issues.
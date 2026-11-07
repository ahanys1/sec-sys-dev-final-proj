# CS 5343 Final Project

**Due:** Wednesday, 25 November 2026 by 11:59 pm
**Points:** 200

## Secure Software Development Final Project

For the final project in class, your team (of two or three) will be developing a program using AI to assist. The AI assistance will take place throughout the software development process. The goal is to see how you can ensure that an AI-assisted software project can result in a secure software product.

## 1. The Software Application

You will design, implement, test, and deliver a secure incident reporting application using the Security Development Lifecycle (SDL) Model or the Secure Software Systems Life Cycle model, both discussed this semester in Lesson 04.

### 1.1 Scope

The application you will develop will enable users to submit incident reports, reviewers to classify and manage those reports, and administrators to manage users and system settings. The application must be designed and implemented with strong security controls aligned with industry standards (CIS, OWASP ASVS, OWASP Top 10, etc.).

### 1.2 Stakeholders

- **Users:** Submit incident reports
- **Reviewers:** Review, classify, comment, and close reports
- **Administrators:** Manage users, roles, and system configuration

## 2. System Overview

The Secure Incident-Reporting Application is a three-tier web system consisting of:

- **Front End:** A user interface (UI or GUI) that allows stakeholders to access the application to accomplish an appropriate task.
- **Backend:** The business logic for handling the incident reports as well as other tasks such as authentication and authorization.
- **Database:** Persistent storage for incidents, users, comments, and audit logs.

The system must enforce role-based access control (RBAC) and maintain an immutable audit trail of key actions.

## 3. Functional Requirements (FR)

### 3.1 User Management

- **FR-1:** The system shall allow administrators to create new user accounts.
- **FR-2:** The system shall allow administrators to assign roles (user, reviewer, admin).
- **FR-3:** The system shall allow administrators to deactivate or update user accounts.
- **FR-4:** The system shall allow users to authenticate using a username and password.
- **FR-5:** The system shall allow users to securely log out.

### 3.2 Incident Management

- **FR-6:** The system shall allow authenticated users to submit incident reports containing a title and description.
- **FR-7:** The system shall allow reviewers to view all open incidents.
- **FR-8:** The system shall allow reviewers to update incident status (open, under-review, closed).
- **FR-9:** The system shall allow reviewers and administrators to add comments to incidents.
- **FR-10:** The system shall allow administrators to view all incidents regardless of status.

### 3.3 Audit Logging

- **FR-11:** The system shall log all key actions, including:
  - Incident creation
  - Incident status changes
  - Comment creation
  - User creation, role changes, and deactivation
  - Password changes
- **FR-12:** Audit logs shall be immutable and append-only.

### 3.4 System Interfaces

- **FR-13:** The system shall provide a user interface for all roles.

## 4. Non-Functional Requirements (NFR)

### 4.1 Usability

- **NFR-1:** The system shall provide a clear, intuitive UI for all roles.
- **NFR-2:** Error messages shall be user-friendly and not reveal internal details.

### 4.2 Performance

- **NFR-3:** The system shall respond to user actions within 2 seconds under normal load.

### 4.3 Scalability

- **NFR-4:** The system shall support at least 50 concurrent users.

### 4.3 Reliability

- **NFR-5:** If web-based, the system shall maintain data integrity during concurrent operations.
- **NFR-6:** The system shall recover gracefully from unexpected errors.

### 4.4 Maintainability

- **NFR-7:** The system shall follow modular design principles.
- **NFR-8:** The system shall include documentation for all major components.

### 4.5 Portability

- **NFR-9:** The system shall run on either Windows, macOS, or Linux environments.

## 5. Security Requirements (SR)

*(Aligned with OWASP ASVS Level 1/2)*

### 5.1 Authentication

- **SR-1:** The system shall require authentication for all non-public endpoints.
- **SR-2:** Passwords shall be stored using an established and secure algorithm.
- **SR-3:** If web-based, authentication tokens (e.g. session cookies) shall be protected using secure flags (HttpOnly, Secure, SameSite).

### 5.2 Authorization

- **SR-4:** The system shall enforce RBAC for user, reviewer, and admin roles.
- **SR-5:** Authorization checks shall be performed for every request.
- **SR-6:** Users shall not be able to modify their own roles.

### 5.3 Input Validation

- **SR-7:** All user input shall be validated and sanitized.
- **SR-8:** The system shall use parameterized queries for all database operations.

### 5.4 Logging & Monitoring

- **SR-9:** Logs shall not contain sensitive data (passwords, tokens, full incident descriptions).
- **SR-10:** Audit logs shall include user ID, timestamp, action, and target ID.
- **SR-11:** Logs shall be protected from tampering.

### 5.5 Error Handling

- **SR-12:** Error messages shall not reveal queries.
- **SR-13:** Detailed errors shall be logged.

### 5.6 Data Protection

- **SR-14:** Secrets (DB credentials) shall not be stored in an unencrypted mode.

### 5.7 OWASP Top 10 Mitigations

- **SR-16:** The system shall protect against:
  - Sensitive data exposure
  - Security misconfiguration
  - Insufficient logging & monitoring

## 6. Data Requirements

### 6.1 Data Entities

- Users
- Roles
- Incidents
- Comments
- Audit Logs

### 6.2 Data Sensitivity Classification

- **Public:** System status messages
- **Internal:** Incident titles, statuses
- **Sensitive:** Incident descriptions, user roles
- **Highly Sensitive:** Password hashes, tokens, secrets

## 7. System Constraints

- **CONST-1:** The system shall use secure coding practices throughout development.
- **CONST-2:** The system shall be developed using version control.
- **CONST-3:** The system shall be developed using Copilot for AI assistance.

## 8. Assumptions

- **ASSUMP-1:** Students will use AI tools responsibly and document their usage.
- **ASSUMP-2:** No real personal data will be used during development or testing.

## 9. Acceptance Criteria

- **AC-1:** All functional requirements must be implemented.
- **AC-2:** All security requirements must be demonstrated and validated.
- **AC-3:** The system must pass SAST (Static Application Security Testing), DAST (Dynamic Application Security Testing), and manual security testing.
- **AC-4:** The final report must document SDL or Secure Software Systems Life Cycle model adherence and AI usage.
- **AC-5:** A demo video must show core functionality and security controls.

## Submission Requirements

A final report shall be uploaded for the team (only one person needs to upload the submission). The report should include the following, which should have been assisted by AI (any changes made to an AI deliverable should be noted, e.g. for security purposes):

- A single page listing the team number, the names and emails for your team members, the portion of the project each was chiefly responsible for or participated in, and a list of the documents you are submitting. Your names should not appear on any other document submitted – only your team number should be included on the following documents.
- The design document.
- A STRIDE analysis.
- A Threat Model and attack surface analysis.
- USE- and MISUSE-cases used for testing.
- An explanation of your SAST and DAST.
- An explanation of how the 10 OWASP Security by Design Principles (see Lesson 17) were followed/applied (if a principle was not applicable, simply state why and move on to the next).
- An AI usage report that details what AI provided and any changes the team made to what was provided by AI and why the change was made. This is particularly true for changes made due to a need to enhance security.
- A copy of the code that includes in-line documentation.
- A user manual.
- A video demonstrating the working product. This should include illustrating correct use of the application as well as attempted misuse such as attempting to log in as a user with higher privileges, external attempts to access the data used by the application (the database data), or attempts to conduct an action the individual was not authorized to conduct.

You may use whatever programming language you want in order to implement the application.

The video can be uploaded to Canvas if it is short enough or uploaded to a location such as YouTube and the URL provided so the instructor can watch the video. Not everybody has to participate in the video if you prefer to have one person be the narrator for your team's video. You may use whatever product you want to create the video as long as it can ultimately be viewed without any special software or permissions.

# V15 Secure Coding and Architecture

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V15.1 Secure Coding and Architecture Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V15.1.1 | 1 | Verify that application documentation defines risk based remediation time frames for 3rd party component versions with vulnerabilities and for updating libraries in general, to minimize the risk from these components. | TODO | |
| V15.1.2 | 2 | Verify that an inventory catalog, such as software bill of materials (SBOM), is maintained of all third-party libraries in use, including verifying that components come from pre-defined, trusted, and continually maintained repositories. | TODO | |
| V15.1.3 | 2 | Verify that the application documentation identifies functionality which is time-consuming or resource-demanding. This must include how to prevent a loss of availability due to overusing this functionality and how to avoid a situation where building a response takes longer than the consumer's timeout. Potential defenses may include asynchronous processing, using queues, and limiting parallel processes per user and per application. | TODO | |

## V15.2 Security Architecture and Dependencies

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V15.2.1 | 1 | Verify that the application only contains components which have not breached the documented update and remediation time frames. | TODO | |
| V15.2.2 | 2 | Verify that the application has implemented defenses against loss of availability due to functionality which is time-consuming or resource-demanding, based on the documented security decisions and strategies for this. | TODO | |
| V15.2.3 | 2 | Verify that the production environment only includes functionality that is required for the application to function, and does not expose extraneous functionality such as test code, sample snippets, and development functionality. | TODO | |

## V15.3 Defensive Coding

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V15.3.1 | 1 | Verify that the application only returns the required subset of fields from a data object. For example, it should not return an entire data object, as some individual fields should not be accessible to users. | TODO | |
| V15.3.2 | 2 | Verify that where the application backend makes calls to external URLs, it is configured to not follow redirects unless it is intended functionality. | TODO | |
| V15.3.3 | 2 | Verify that the application has countermeasures to protect against mass assignment attacks by limiting allowed fields per controller and action, e.g., it is not possible to insert or update a field value when it was not intended to be part of that action. | TODO | |
| V15.3.4 | 2 | Verify that all proxying and middleware components transfer the user's original IP address correctly using trusted data fields that cannot be manipulated by the end user, and the application and web server use this correct value for logging and security decisions such as rate limiting, taking into account that even the original IP address may not be reliable due to dynamic IPs, VPNs, or corporate firewalls. | TODO | |
| V15.3.5 | 2 | Verify that the application explicitly ensures that variables are of the correct type and performs strict equality and comparator operations. This is to avoid type juggling or type confusion vulnerabilities caused by the application code making an assumption about a variable type. | TODO | |
| V15.3.6 | 2 | Verify that JavaScript code is written in a way that prevents prototype pollution, for example, by using Set() or Map() instead of object literals. | TODO | |
| V15.3.7 | 2 | Verify that the application has defenses against HTTP parameter pollution attacks, particularly if the application framework makes no distinction about the source of request parameters (query string, body parameters, cookies, or header fields). | TODO | |

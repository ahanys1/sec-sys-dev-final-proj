# V13 Configuration

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V13.1 Configuration Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V13.1.1 | 2 | Verify that all communication needs for the application are documented. This must include external services which the application relies upon and cases where an end user might be able to provide an external location to which the application will then connect. | TODO | |

## V13.2 Backend Communication Configuration

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V13.2.1 | 2 | Verify that communications between backend application components that don't support the application's standard user session mechanism, including APIs, middleware, and data layers, are authenticated. Authentication must use individual service accounts, short-term tokens, or certificate-based authentication and not unchanging credentials such as passwords, API keys, or shared accounts with privileged access. | TODO | |
| V13.2.2 | 2 | Verify that communications between backend application components, including local or operating system services, APIs, middleware, and data layers, are performed with accounts assigned the least necessary privileges. | TODO | |
| V13.2.3 | 2 | Verify that if a credential has to be used for service authentication, the credential being used by the consumer is not a default credential (e.g., root/root or admin/admin). | TODO | |
| V13.2.4 | 2 | Verify that an allowlist is used to define the external resources or systems with which the application is permitted to communicate (e.g., for outbound requests, data loads, or file access). This allowlist can be implemented at the application layer, web server, firewall, or a combination of different layers. | TODO | |
| V13.2.5 | 2 | Verify that the web or application server is configured with an allowlist of resources or systems to which the server can send requests or load data or files from. | TODO | |

## V13.3 Secret Management

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V13.3.1 | 2 | Verify that a secrets management solution, such as a key vault, is used to securely create, store, control access to, and destroy backend secrets. These could include passwords, key material, integrations with databases and third-party systems, keys and seeds for time-based tokens, other internal secrets, and API keys. Secrets must not be included in application source code or included in build artifacts. For an L3 application, this must involve a hardware-backed solution such as an HSM. | TODO | |
| V13.3.2 | 2 | Verify that access to secret assets adheres to the principle of least privilege. | TODO | |

## V13.4 Unintended Information Leakage

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V13.4.1 | 1 | Verify that the application is deployed either without any source control metadata, including the .git or .svn folders, or in a way that these folders are inaccessible both externally and to the application itself. | TODO | |
| V13.4.2 | 2 | Verify that debug modes are disabled for all components in production environments to prevent exposure of debugging features and information leakage. | TODO | |
| V13.4.3 | 2 | Verify that web servers do not expose directory listings to clients unless explicitly intended. | TODO | |
| V13.4.4 | 2 | Verify that using the HTTP TRACE method is not supported in production environments, to avoid potential information leakage. | TODO | |
| V13.4.5 | 2 | Verify that documentation (such as for internal APIs) and monitoring endpoints are not exposed unless explicitly intended. | TODO | |

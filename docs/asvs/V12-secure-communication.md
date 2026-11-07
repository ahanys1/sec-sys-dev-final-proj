# V12 Secure Communication

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V12.1 General TLS Security Guidance

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V12.1.1 | 1 | Verify that only the latest recommended versions of the TLS protocol are enabled, such as TLS 1.2 and TLS 1.3. The latest version of the TLS protocol must be the preferred option. | TODO | |
| V12.1.2 | 2 | Verify that only recommended cipher suites are enabled, with the strongest cipher suites set as preferred. L3 applications must only support cipher suites which provide forward secrecy. | TODO | |
| V12.1.3 | 2 | Verify that the application validates that mTLS client certificates are trusted before using the certificate identity for authentication or authorization. | TODO | |

## V12.2 HTTPS Communication with External Facing Services

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V12.2.1 | 1 | Verify that TLS is used for all connectivity between a client and external facing, HTTP-based services, and does not fall back to insecure or unencrypted communications. | TODO | |
| V12.2.2 | 1 | Verify that external facing services use publicly trusted TLS certificates. | TODO | |

## V12.3 General Service to Service Communication Security

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V12.3.1 | 2 | Verify that an encrypted protocol such as TLS is used for all inbound and outbound connections to and from the application, including monitoring systems, management tools, remote access and SSH, middleware, databases, mainframes, partner systems, or external APIs. The server must not fall back to insecure or unencrypted protocols. | TODO | |
| V12.3.2 | 2 | Verify that TLS clients validate certificates received before communicating with a TLS server. | TODO | |
| V12.3.3 | 2 | Verify that TLS or another appropriate transport encryption mechanism used for all connectivity between internal, HTTP-based services within the application, and does not fall back to insecure or unencrypted communications. | TODO | |
| V12.3.4 | 2 | Verify that TLS connections between internal services use trusted certificates. Where internally generated or self-signed certificates are used, the consuming service must be configured to only trust specific internal CAs and specific self-signed certificates. | TODO | |

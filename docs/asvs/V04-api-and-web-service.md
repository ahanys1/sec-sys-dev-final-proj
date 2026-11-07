# V4 API and Web Service

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V4.1 Generic Web Service Security

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V4.1.1 | 1 | Verify that every HTTP response with a message body contains a Content-Type header field that matches the actual content of the response, including the charset parameter to specify safe character encoding (e.g., UTF-8, ISO-8859-1) according to IANA Media Types, such as "text/", "/+xml" and "/xml". | TODO | |
| V4.1.2 | 2 | Verify that only user-facing endpoints (intended for manual web-browser access) automatically redirect from HTTP to HTTPS, while other services or endpoints do not implement transparent redirects. This is to avoid a situation where a client is erroneously sending unencrypted HTTP requests, but since the requests are being automatically redirected to HTTPS, the leakage of sensitive data goes undiscovered. | TODO | |
| V4.1.3 | 2 | Verify that any HTTP header field used by the application and set by an intermediary layer, such as a load balancer, a web proxy, or a backend-for-frontend service, cannot be overridden by the end-user. Example headers might include X-Real-IP, X-Forwarded-*, or X-User-ID. | TODO | |

## V4.2 HTTP Message Structure Validation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V4.2.1 | 2 | Verify that all application components (including load balancers, firewalls, and application servers) determine boundaries of incoming HTTP messages using the appropriate mechanism for the HTTP version to prevent HTTP request smuggling. In HTTP/1.x, if a Transfer-Encoding header field is present, the Content-Length header must be ignored per RFC 2616. When using HTTP/2 or HTTP/3, if a Content-Length header field is present, the receiver must ensure that it is consistent with the length of the DATA frames. | TODO | |

## V4.3 GraphQL

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V4.3.1 | 2 | Verify that a query allowlist, depth limiting, amount limiting, or query cost analysis is used to prevent GraphQL or data layer expression Denial of Service (DoS) as a result of expensive, nested queries. | TODO | |
| V4.3.2 | 2 | Verify that GraphQL introspection queries are disabled in the production environment unless the GraphQL API is meant to be used by other parties. | TODO | |

## V4.4 WebSocket

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V4.4.1 | 1 | Verify that WebSocket over TLS (WSS) is used for all WebSocket connections. | TODO | |
| V4.4.2 | 2 | Verify that, during the initial HTTP WebSocket handshake, the Origin header field is checked against a list of origins allowed for the application. | TODO | |
| V4.4.3 | 2 | Verify that, if the application's standard session management cannot be used, dedicated tokens are being used for this, which comply with the relevant Session Management security requirements. | TODO | |
| V4.4.4 | 2 | Verify that dedicated WebSocket session management tokens are initially obtained or validated through the previously authenticated HTTPS session when transitioning an existing HTTPS session to a WebSocket channel. | TODO | |

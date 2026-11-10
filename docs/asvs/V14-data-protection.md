# V14 Data Protection

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V14.1 Data Protection Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V14.1.1 | 2 | Verify that all sensitive data created and processed by the application has been identified and classified into protection levels. This includes data that is only encoded and therefore easily decoded, such as Base64 strings or the plaintext payload inside a JWT. Protection levels need to take into account any data protection and privacy regulations and standards which the application is required to comply with. | TODO | |
| V14.1.2 | 2 | Verify that all sensitive data protection levels have a documented set of protection requirements. This must include (but not be limited to) requirements related to general encryption, integrity verification, retention, how the data is to be logged, access controls around sensitive data in logs, database-level encryption, privacy and privacy-enhancing technologies to be used, and other confidentiality requirements. | TODO | |

## V14.2 General Data Protection

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V14.2.1 | 1 | Verify that sensitive data is only sent to the server in the HTTP message body or header fields, and that the URL and query string do not contain sensitive information, such as an API key or session token. | TODO | |
| V14.2.2 | 2 | Verify that the application prevents sensitive data from being cached in server components, such as load balancers and application caches, or ensures that the data is securely purged after use. | TODO | |
| V14.2.3 | 2 | Verify that defined sensitive data is not sent to untrusted parties (e.g., user trackers) to prevent unwanted collection of data outside of the application's control. | TODO | |
| V14.2.4 | 2 | Verify that controls around sensitive data related to encryption, integrity verification, retention, how the data is to be logged, access controls around sensitive data in logs, privacy and privacy-enhancing technologies, are implemented as defined in the documentation for the specific data's protection level. | TODO | |

## V14.3 Client-side Data Protection

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V14.3.1 | 1 | Verify that authenticated data is cleared from client storage, such as the browser DOM, after the client or session is terminated. The 'Clear-Site-Data' HTTP response header field may be able to help with this but the client-side should also be able to clear up if the server connection is not available when the session is terminated. | TODO | |
| V14.3.2 | 2 | Verify that the application sets sufficient anti-caching HTTP response header fields (i.e., Cache-Control: no-store) so that sensitive data is not cached in browsers. | TODO | |
| V14.3.3 | 2 | Verify that data stored in browser storage (such as localStorage, sessionStorage, IndexedDB, or cookies) does not contain sensitive data, with the exception of session tokens. | TODO | |

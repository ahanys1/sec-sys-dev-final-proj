# V1 Encoding and Sanitization

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V1.1 Encoding and Sanitization Architecture

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V1.1.1 | 2 | Verify that input is decoded or unescaped into a canonical form only once, it is only decoded when encoded data in that form is expected, and that this is done before processing the input further, for example it is not performed after input validation or sanitization. | TODO | |
| V1.1.2 | 2 | Verify that the application performs output encoding and escaping either as a final step before being used by the interpreter for which it is intended or by the interpreter itself. | TODO | |

## V1.2 Injection Prevention

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V1.2.1 | 1 | Verify that output encoding for an HTTP response, HTML document, or XML document is relevant for the context required, such as encoding the relevant characters for HTML elements, HTML attributes, HTML comments, CSS, or HTTP header fields, to avoid changing the message or document structure. | TODO | |
| V1.2.2 | 1 | Verify that when dynamically building URLs, untrusted data is encoded according to its context (e.g., URL encoding or base64url encoding for query or path parameters). Ensure that only safe URL protocols are permitted (e.g., disallow javascript: or data:). | TODO | |
| V1.2.3 | 1 | Verify that output encoding or escaping is used when dynamically building JavaScript content (including JSON), to avoid changing the message or document structure (to avoid JavaScript and JSON injection). | TODO | |
| V1.2.4 | 1 | Verify that data selection or database queries (e.g., SQL, HQL, NoSQL, Cypher) use parameterized queries, ORMs, entity frameworks, or are otherwise protected from SQL Injection and other database injection attacks. This is also relevant when writing stored procedures. | TODO | |
| V1.2.5 | 1 | Verify that the application protects against OS command injection and that operating system calls use parameterized OS queries or use contextual command line output encoding. | TODO | |
| V1.2.6 | 2 | Verify that the application protects against LDAP injection vulnerabilities, or that specific security controls to prevent LDAP injection have been implemented. | TODO | |
| V1.2.7 | 2 | Verify that the application is protected against XPath injection attacks by using query parameterization or precompiled queries. | TODO | |
| V1.2.8 | 2 | Verify that LaTeX processors are configured securely (such as not using the "--shell-escape" flag) and an allowlist of commands is used to prevent LaTeX injection attacks. | TODO | |
| V1.2.9 | 2 | Verify that the application escapes special characters in regular expressions (typically using a backslash) to prevent them from being misinterpreted as metacharacters. | TODO | |

## V1.3 Sanitization

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V1.3.1 | 1 | Verify that all untrusted HTML input from WYSIWYG editors or similar is sanitized using a well-known and secure HTML sanitization library or framework feature. | TODO | |
| V1.3.2 | 1 | Verify that the application avoids the use of eval() or other dynamic code execution features such as Spring Expression Language (SpEL). Where there is no alternative, any user input being included must be sanitized before being executed. | TODO | |
| V1.3.3 | 2 | Verify that data being passed to a potentially dangerous context is sanitized beforehand to enforce safety measures, such as only allowing characters which are safe for this context and trimming input which is too long. | TODO | |
| V1.3.4 | 2 | Verify that user-supplied Scalable Vector Graphics (SVG) scriptable content is validated or sanitized to contain only tags and attributes (such as draw graphics) that are safe for the application, e.g., do not contain scripts and foreignObject. | TODO | |
| V1.3.5 | 2 | Verify that the application sanitizes or disables user-supplied scriptable or expression template language content, such as Markdown, CSS or XSL stylesheets, BBCode, or similar. | TODO | |
| V1.3.6 | 2 | Verify that the application protects against Server-side Request Forgery (SSRF) attacks, by validating untrusted data against an allowlist of protocols, domains, paths and ports and sanitizing potentially dangerous characters before using the data to call another service. | TODO | |
| V1.3.7 | 2 | Verify that the application protects against template injection attacks by not allowing templates to be built based on untrusted input. Where there is no alternative, any untrusted input being included dynamically during template creation must be sanitized or strictly validated. | TODO | |
| V1.3.8 | 2 | Verify that the application appropriately sanitizes untrusted input before use in Java Naming and Directory Interface (JNDI) queries and that JNDI is configured securely to prevent JNDI injection attacks. | TODO | |
| V1.3.9 | 2 | Verify that the application sanitizes content before it is sent to memcache to prevent injection attacks. | TODO | |
| V1.3.10 | 2 | Verify that format strings which might resolve in an unexpected or malicious way when used are sanitized before being processed. | TODO | |
| V1.3.11 | 2 | Verify that the application sanitizes user input before passing to mail systems to protect against SMTP or IMAP injection. | TODO | |

## V1.4 Memory, String, and Unmanaged Code

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V1.4.1 | 2 | Verify that the application uses memory-safe string, safer memory copy and pointer arithmetic to detect or prevent stack, buffer, or heap overflows. | TODO | |
| V1.4.2 | 2 | Verify that sign, range, and input validation techniques are used to prevent integer overflows. | TODO | |
| V1.4.3 | 2 | Verify that dynamically allocated memory and resources are released, and that references or pointers to freed memory are removed or set to null to prevent dangling pointers and use-after-free vulnerabilities. | TODO | |

## V1.5 Safe Deserialization

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V1.5.1 | 1 | Verify that the application configures XML parsers to use a restrictive configuration and that unsafe features such as resolving external entities are disabled to prevent XML eXternal Entity (XXE) attacks. | TODO | |
| V1.5.2 | 2 | Verify that deserialization of untrusted data enforces safe input handling, such as using an allowlist of object types or restricting client-defined object types, to prevent deserialization attacks. Deserialization mechanisms that are explicitly defined as insecure must not be used with untrusted input. | TODO | |

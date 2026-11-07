# V16 Security Logging and Error Handling

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V16.1 Security Logging Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V16.1.1 | 2 | Verify that an inventory exists documenting the logging performed at each layer of the application's technology stack, what events are being logged, log formats, where that logging is stored, how it is used, how access to it is controlled, and for how long logs are kept. | TODO | |

## V16.2 General Logging

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V16.2.1 | 2 | Verify that each log entry includes necessary metadata (such as when, where, who, what) that would allow for a detailed investigation of the timeline when an event happens. | TODO | |
| V16.2.2 | 2 | Verify that time sources for all logging components are synchronized, and that timestamps in security event metadata use UTC or include an explicit time zone offset. UTC is recommended to ensure consistency across distributed systems and to prevent confusion during daylight saving time transitions. | TODO | |
| V16.2.3 | 2 | Verify that the application only stores or broadcasts logs to the files and services that are documented in the log inventory. | TODO | |
| V16.2.4 | 2 | Verify that logs can be read and correlated by the log processor that is in use, preferably by using a common logging format. | TODO | |
| V16.2.5 | 2 | Verify that when logging sensitive data, the application enforces logging based on the data's protection level. For example, it may not be allowed to log certain data, such as credentials or payment details. Other data, such as session tokens, may only be logged by being hashed or masked, either in full or partially. | TODO | |

## V16.3 Security Events

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V16.3.1 | 2 | Verify that all authentication operations are logged, including successful and unsuccessful attempts. Additional metadata, such as the type of authentication or factors used, should also be collected. | TODO | |
| V16.3.2 | 2 | Verify that failed authorization attempts are logged. For L3, this must include logging all authorization decisions, including logging when sensitive data is accessed (without logging the sensitive data itself). | TODO | |
| V16.3.3 | 2 | Verify that the application logs the security events that are defined in the documentation and also logs attempts to bypass the security controls, such as input validation, business logic, and anti-automation. | TODO | |
| V16.3.4 | 2 | Verify that the application logs unexpected errors and security control failures such as backend TLS failures. | TODO | |

## V16.4 Log Protection

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V16.4.1 | 2 | Verify that all logging components appropriately encode data to prevent log injection. | TODO | |
| V16.4.2 | 2 | Verify that logs are protected from unauthorized access and cannot be modified. | TODO | |
| V16.4.3 | 2 | Verify that logs are securely transmitted to a logically separate system for analysis, detection, alerting, and escalation. The aim is to ensure that if the application is breached, the logs are not compromised. | TODO | |

## V16.5 Error Handling

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V16.5.1 | 2 | Verify that a generic message is returned to the consumer when an unexpected or security-sensitive error occurs, ensuring no exposure of sensitive internal system data such as stack traces, queries, secret keys, and tokens. | TODO | |
| V16.5.2 | 2 | Verify that the application continues to operate securely when external resource access fails, for example, by using patterns such as circuit breakers or graceful degradation. | TODO | |
| V16.5.3 | 2 | Verify that the application fails gracefully and securely, including when an exception occurs, preventing fail-open conditions such as processing a transaction despite errors resulting from validation logic. | TODO | |

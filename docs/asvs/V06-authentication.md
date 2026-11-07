# V6 Authentication

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V6.1 Authentication Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.1.1 | 1 | Verify that application documentation defines how controls such as rate limiting, anti-automation, and adaptive response, are used to defend against attacks such as credential stuffing and password brute force. The documentation must make clear how these controls are configured and prevent malicious account lockout. | TODO | |
| V6.1.2 | 2 | Verify that a list of context-specific words is documented in order to prevent their use in passwords. The list could include permutations of organization names, product names, system identifiers, project codenames, department or role names, and similar. | TODO | |
| V6.1.3 | 2 | Verify that, if the application includes multiple authentication pathways, these are all documented together with the security controls and authentication strength which must be consistently enforced across them. | TODO | |

## V6.2 Password Security

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.2.1 | 1 | Verify that user set passwords are at least 8 characters in length although a minimum of 15 characters is strongly recommended. | TODO | |
| V6.2.2 | 1 | Verify that users can change their password. | TODO | |
| V6.2.3 | 1 | Verify that password change functionality requires the user's current and new password. | TODO | |
| V6.2.4 | 1 | Verify that passwords submitted during account registration or password change are checked against an available set of, at least, the top 3000 passwords which match the application's password policy, e.g. minimum length. | TODO | |
| V6.2.5 | 1 | Verify that passwords of any composition can be used, without rules limiting the type of characters permitted. There must be no requirement for a minimum number of upper or lower case characters, numbers, or special characters. | TODO | |
| V6.2.6 | 1 | Verify that password input fields use type=password to mask the entry. Applications may allow the user to temporarily view the entire masked password, or the last typed character of the password. | TODO | |
| V6.2.7 | 1 | Verify that "paste" functionality, browser password helpers, and external password managers are permitted. | TODO | |
| V6.2.8 | 1 | Verify that the application verifies the user's password exactly as received from the user, without any modifications such as truncation or case transformation. | TODO | |
| V6.2.9 | 2 | Verify that passwords of at least 64 characters are permitted. | TODO | |
| V6.2.10 | 2 | Verify that a user's password stays valid until it is discovered to be compromised or the user rotates it. The application must not require periodic credential rotation. | TODO | |
| V6.2.11 | 2 | Verify that the documented list of context specific words is used to prevent easy to guess passwords being created. | TODO | |
| V6.2.12 | 2 | Verify that passwords submitted during account registration or password changes are checked against a set of breached passwords. | TODO | |

## V6.3 General Authentication Security

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.3.1 | 1 | Verify that controls to prevent attacks such as credential stuffing and password brute force are implemented according to the application's security documentation. | TODO | |
| V6.3.2 | 1 | Verify that default user accounts (e.g., "root", "admin", or "sa") are not present in the application or are disabled. | TODO | |
| V6.3.3 | 2 | Verify that either a multi-factor authentication mechanism or a combination of single-factor authentication mechanisms, must be used in order to access the application. For L3, one of the factors must be a hardware-based authentication mechanism which provides compromise and impersonation resistance against phishing attacks while verifying the intent to authenticate by requiring a user-initiated action (such as a button press on a FIDO hardware key or a mobile phone). Relaxing any of the considerations in this requirement requires a fully documented rationale and a comprehensive set of mitigating controls. | TODO | |
| V6.3.4 | 2 | Verify that, if the application includes multiple authentication pathways, there are no undocumented pathways and that security controls and authentication strength are enforced consistently. | TODO | |

## V6.4 Authentication Factor Lifecycle and Recovery

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.4.1 | 1 | Verify that system generated initial passwords or activation codes are securely randomly generated, follow the existing password policy, and expire after a short period of time or after they are initially used. These initial secrets must not be permitted to become the long term password. | TODO | |
| V6.4.2 | 1 | Verify that password hints or knowledge-based authentication (so-called "secret questions") are not present. | TODO | |
| V6.4.3 | 2 | Verify that a secure process for resetting a forgotten password is implemented, that does not bypass any enabled multi-factor authentication mechanisms. | TODO | |
| V6.4.4 | 2 | Verify that if a multi-factor authentication factor is lost, evidence of identity proofing is performed at the same level as during enrollment. | TODO | |

## V6.5 General Multi-factor authentication requirements

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.5.1 | 2 | Verify that lookup secrets, out-of-band authentication requests or codes, and time-based one-time passwords (TOTPs) are only successfully usable once. | TODO | |
| V6.5.2 | 2 | Verify that, when being stored in the application's backend, lookup secrets with less than 112 bits of entropy (19 random alphanumeric characters or 34 random digits) are hashed with an approved password storage hashing algorithm that incorporates a 32-bit random salt. A standard hash function can be used if the secret has 112 bits of entropy or more. | TODO | |
| V6.5.3 | 2 | Verify that lookup secrets, out-of-band authentication code, and time-based one-time password seeds, are generated using a Cryptographically Secure Pseudorandom Number Generator (CSPRNG) to avoid predictable values. | TODO | |
| V6.5.4 | 2 | Verify that lookup secrets and out-of-band authentication codes have a minimum of 20 bits of entropy (typically 4 random alphanumeric characters or 6 random digits is sufficient). | TODO | |
| V6.5.5 | 2 | Verify that out-of-band authentication requests, codes, or tokens, as well as time-based one-time passwords (TOTPs) have a defined lifetime. Out of band requests must have a maximum lifetime of 10 minutes and for TOTP a maximum lifetime of 30 seconds. | TODO | |

## V6.6 Out-of-Band authentication mechanisms

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.6.1 | 2 | Verify that authentication mechanisms using the Public Switched Telephone Network (PSTN) to deliver One-time Passwords (OTPs) via phone or SMS are offered only when the phone number has previously been validated, alternate stronger methods (such as Time based One-time Passwords) are also offered, and the service provides information on their security risks to users. For L3 applications, phone and SMS must not be available as options. | TODO | |
| V6.6.2 | 2 | Verify that out-of-band authentication requests, codes, or tokens are bound to the original authentication request for which they were generated and are not usable for a previous or subsequent one. | TODO | |
| V6.6.3 | 2 | Verify that a code based out-of-band authentication mechanism is protected against brute force attacks by using rate limiting. Consider also using a code with at least 64 bits of entropy. | TODO | |

## V6.8 Authentication with an Identity Provider

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V6.8.1 | 2 | Verify that, if the application supports multiple identity providers (IdPs), the user's identity cannot be spoofed via another supported identity provider (eg. by using the same user identifier). The standard mitigation would be for the application to register and identify the user using a combination of the IdP ID (serving as a namespace) and the user's ID in the IdP. | TODO | |
| V6.8.2 | 2 | Verify that the presence and integrity of digital signatures on authentication assertions (for example on JWTs or SAML assertions) are always validated, rejecting any assertions that are unsigned or have invalid signatures. | TODO | |
| V6.8.3 | 2 | Verify that SAML assertions are uniquely processed and used only once within the validity period to prevent replay attacks. | TODO | |
| V6.8.4 | 2 | Verify that, if an application uses a separate Identity Provider (IdP) and expects specific authentication strength, methods, or recentness for specific functions, the application verifies this using the information returned by the IdP. For example, if OIDC is used, this might be achieved by validating ID Token claims such as 'acr', 'amr', and 'auth_time' (if present). If the IdP does not provide this information, the application must have a documented fallback approach that assumes that the minimum strength authentication mechanism was used (for example, single-factor authentication using username and password). | TODO | |

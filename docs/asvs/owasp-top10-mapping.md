# OWASP Top 10 to ASVS Mapping

ASVS isn't organized by the Top 10, and OWASP publishes no official Top 10 mapping for v5.0.0. This crosswalk is the team's own, so treat it as guidance. Completing the ASVS L2 checklist in this folder addresses each category; it isn't a formal Top 10 certification.

Edition: **OWASP Top 10:2025** (2021 equivalent in parentheses). The assignment's SR-16 names the older terms "sensitive data exposure", "security misconfiguration", and "insufficient logging & monitoring"; these map to A04, A02, and A09.

| Top 10:2025 | ASVS chapters | Key requirements | Coverage |
|---|---|---|---|
| A01 Broken Access Control (2021 A01) | V08, V01 | V8.2.1, V8.2.2, V8.3.1, V1.3.6, V15.3.3 | Full |
| A02 Security Misconfiguration (2021 A05) | V13, V03, V12 | V13.4.1, V13.4.2, V13.3.1, V3.4.1, V3.4.3, V12.1.1 | Full |
| A03 Software Supply Chain Failures (2021 A06) | V15 | V15.1.1, V15.1.2, V15.2.1 | Partial: add dependency audit and lockfile to `docs/security-testing.md` |
| A04 Cryptographic Failures (2021 A02) | V11, V12, V14 | V11.4.1, V11.4.2, V12.2.1, V14.2.1 | Full |
| A05 Injection (2021 A03) | V01, V02 | V1.2.1, V1.2.4, V1.2.5, V1.3.2, V2.2.1 | Full |
| A06 Insecure Design (2021 A04) | V02, V08, V15 | V2.3.1, V2.3.2, V8.1.1, V15.3.1 | Partial: also needs the threat model, STRIDE, and SDL docs |
| A07 Authentication Failures (2021 A07) | V06, V07 | V6.2.1, V6.3.1, V6.3.2, V6.4.1, V7.2.4, V7.4.1 | Full |
| A08 Software or Data Integrity Failures (2021 A08) | V15, V01 | V1.5.2, V15.1.2, V15.3.3 | Partial: no CI/CD or update-integrity requirements apply here |
| A09 Security Logging and Alerting Failures (2021 A09) | V16 | V16.2.1, V16.3.1, V16.3.2, V16.3.3, V16.4.2 | Full |
| A10 Mishandling of Exceptional Conditions (new in 2025) | V16 | V16.3.4, V16.5.1, V16.5.2, V16.5.3 | Full |

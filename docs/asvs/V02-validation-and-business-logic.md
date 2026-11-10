# V2 Validation and Business Logic

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V2.1 Validation and Business Logic Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V2.1.1 | 1 | Verify that the application's documentation defines input validation rules for how to check the validity of data items against an expected structure. This could be common data formats such as credit card numbers, email addresses, telephone numbers, or it could be an internal data format. | TODO | |
| V2.1.2 | 2 | Verify that the application's documentation defines how to validate the logical and contextual consistency of combined data items, such as checking that suburb and ZIP code match. | TODO | |
| V2.1.3 | 2 | Verify that expectations for business logic limits and validations are documented, including both per-user and globally across the application. | TODO | |

## V2.2 Input Validation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V2.2.1 | 1 | Verify that input is validated to enforce business or functional expectations for that input. This should either use positive validation against an allow list of values, patterns, and ranges, or be based on comparing the input to an expected structure and logical limits according to predefined rules. For L1, this can focus on input which is used to make specific business or security decisions. For L2 and up, this should apply to all input. | TODO | |
| V2.2.2 | 1 | Verify that the application is designed to enforce input validation at a trusted service layer. While client-side validation improves usability and should be encouraged, it must not be relied upon as a security control. | TODO | |
| V2.2.3 | 2 | Verify that the application ensures that combinations of related data items are reasonable according to the pre-defined rules. | TODO | |

## V2.3 Business Logic Security

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V2.3.1 | 1 | Verify that the application will only process business logic flows for the same user in the expected sequential step order and without skipping steps. | TODO | |
| V2.3.2 | 2 | Verify that business logic limits are implemented per the application's documentation to avoid business logic flaws being exploited. | TODO | |
| V2.3.3 | 2 | Verify that transactions are being used at the business logic level such that either a business logic operation succeeds in its entirety or it is rolled back to the previous correct state. | TODO | |
| V2.3.4 | 2 | Verify that business logic level locking mechanisms are used to ensure that limited quantity resources (such as theater seats or delivery slots) cannot be double-booked by manipulating the application's logic. | TODO | |

## V2.4 Anti-automation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V2.4.1 | 2 | Verify that anti-automation controls are in place to protect against excessive calls to application functions that could lead to data exfiltration, garbage-data creation, quota exhaustion, rate-limit breaches, denial-of-service, or overuse of costly resources. | TODO | |

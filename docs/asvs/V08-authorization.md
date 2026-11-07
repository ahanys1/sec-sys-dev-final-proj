# V8 Authorization

ASVS 5.0.0, Level 1 and 2 requirements. Status: `TODO` / `Done` / `N/A: reason`. `Done` requires evidence (file path or test name). See [README](README.md).

## V8.1 Authorization Documentation

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V8.1.1 | 1 | Verify that authorization documentation defines rules for restricting function-level and data-specific access based on consumer permissions and resource attributes. | TODO | |
| V8.1.2 | 2 | Verify that authorization documentation defines rules for field-level access restrictions (both read and write) based on consumer permissions and resource attributes. Note that these rules might depend on other attribute values of the relevant data object, such as state or status. | TODO | |

## V8.2 General Authorization Design

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V8.2.1 | 1 | Verify that the application ensures that function-level access is restricted to consumers with explicit permissions. | TODO | |
| V8.2.2 | 1 | Verify that the application ensures that data-specific access is restricted to consumers with explicit permissions to specific data items to mitigate insecure direct object reference (IDOR) and broken object level authorization (BOLA). | TODO | |
| V8.2.3 | 2 | Verify that the application ensures that field-level access is restricted to consumers with explicit permissions to specific fields to mitigate broken object property level authorization (BOPLA). | TODO | |

## V8.3 Operation Level Authorization

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V8.3.1 | 1 | Verify that the application enforces authorization rules at a trusted service layer and doesn't rely on controls that an untrusted consumer could manipulate, such as client-side JavaScript. | TODO | |

## V8.4 Other Authorization Considerations

| ID | L | Requirement | Status | Evidence |
|---|---|---|---|---|
| V8.4.1 | 2 | Verify that multi-tenant applications use cross-tenant controls to ensure consumer operations will never affect tenants with which they do not have permissions to interact. | TODO | |

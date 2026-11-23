# User Manual

Team #13

Requirements: NFR-8–9; FR-1–12; SR-1–14 and SR-16. See the [assignment](../ASSIGNMENT.md), [design](design.md), and [source packaging guide](source-packaging.md).

## What is available

This manual describes the source snapshot containing PR #55. Sign-in, sign-out, password changes, and administrator account management are implemented. Incident and comment screens (PR #54), audit viewing and settings (PR #53), and live deployment are pending integration. The workflow section below labels those pending features; it is not evidence that they work. No public site address or shared login is supplied in this document.

Use synthetic accounts and incident content for all demonstrations (ASSUMP-2). Do not enter real personal information, credentials, or tokens in reports, comments, screenshots, or support requests.

## Install and configure

Supported development targets are macOS, Linux, and Windows through WSL2 with Docker integration (NFR-9). Cross-platform execution still needs release verification. Use a current browser with JavaScript and cookies enabled.

Install Git (for a clone), Node.js **24** with npm, Docker with Compose v2, `make`, and OpenSSL. On Windows run the commands inside WSL2, not PowerShell. Docker must be running; ports 80 and 443 must be free. Installation and image builds require internet access to dependency and image registries.

From the repository root or extracted source directory:

```sh
node --version                  # must report v24.x
npm --version
docker compose version
docker info
make install                    # npm ci; also generates the Prisma client
umask 077
make env-local                  # once; generates random local database passwords
chmod 600 .env.local
make up ENV_FILE=.env.local
make migrate ENV_FILE=.env.local
make create-admin ENV_FILE=.env.local
```

The initial build can take several minutes. Run migrations before signing in. The first-administrator command prompts for a username, password, and confirmation; enter these interactively so secrets do not appear in command history. There is no default account or public registration page. Use a synthetic username such as `demo-admin`, 3–32 characters from `a-z`, `0-9`, `.`, `_`, and `-`. Usernames are normalized to lowercase. Use a unique password meeting the policy below. Subsequent accounts should be created through **Users**.

The local configuration contains generated plaintext credentials and must remain private and git-ignored. It is a local development convenience, not evidence that shared/deployed secret management meets SR-14. Never submit it. The shared dotenvx-encrypted `.env` is not yet supplied. Once the team provisions it, obtain `.env.keys` privately, protect it with `chmod 600 .env.keys`, and use the same Make targets without `ENV_FILE=.env.local`. Never put keys in a PR or report.

| Configuration | Meaning |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database bootstrap identity; not an application login |
| `APP_OWNER_PASSWORD` | Migration owner credential |
| `APP_USER_PASSWORD` | Restricted application database credential |
| `SITE_ADDRESS=localhost`, `CADDY_TLS=internal` | Local HTTPS using Caddy's private CA |
| `EXTRA_CA_CERT` | Optional trusted network CA bundle for image builds |

Leave generated passwords unchanged after database initialization. Changing an environment file does not rotate credentials already stored in PostgreSQL. Preserve the original configuration securely; ask the operator to coordinate rotation instead of deleting data.

### Trust the local HTTPS certificate

Caddy is the only published service; the app and PostgreSQL are reachable only on Docker networks. Open **https://localhost** after trusting the CA from your own local stack (SR-3, SR-16; ASVS V12.2.1). Do not bypass certificate validation or use HTTP for account workflows.

Copy the public root certificate from the running Caddy service:

```sh
npx dotenvx run -f .env.local -- docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
openssl x509 -in caddy-root.crt -noout -subject -fingerprint -sha256
```

Import that certificate into the trust store of the machine running your browser: Keychain Access/System on macOS; your Linux distribution's local CA store; or the Windows host's Trusted Root Certification Authorities when using WSL2. Browsers with their own certificate store may need a separate import. Only trust the certificate you copied from this stack. Restart the browser if needed. Remove that trust when the local stack is retired. Recreating the Caddy volume changes its CA and requires repeating this step.

A live deployment needs its own approved domain and publicly trusted certificate; these local instructions are not a completed live deployment procedure.

## Start, stop, and check the service

Run these commands from the source root:

| Task | Command |
|---|---|
| Start or rebuild | `make up ENV_FILE=.env.local` |
| Apply new migrations | `make migrate ENV_FILE=.env.local` |
| Show service state | `npx dotenvx run -f .env.local -- docker compose ps` |
| Follow operator logs | `make logs ENV_FILE=.env.local` (Ctrl-C stops following, not the services) |
| Stop and retain stored data | `make down ENV_FILE=.env.local` |
| List developer commands | `make help` |

After trusting the CA, visit `/api/health` at the same HTTPS origin for a basic service response, then sign in to check database-backed behavior. A health response alone is not proof that migrations or every workflow succeeded.

**Destructive reset:** `make reset ENV_FILE=.env.local` deletes Compose volumes, including the database and Caddy CA. Use it only for a deliberately disposable synthetic environment. It is not a password-recovery or routine troubleshooting command. Backup/restore tooling and a recovery drill remain tracked in #14; no verified recovery procedure is claimed here.

`make dev` serves the development UI at HTTP port 3000. It does not start PostgreSQL or the HTTPS proxy and is not the documented end-to-end sign-in environment.

## Sign in, change a password, and sign out

1. Open the trusted HTTPS address. A signed-out visitor is directed to `/login`.
2. Enter the account's username and password, then select **Sign in**.
3. A new or reset account is sent to **Change password** before it can use protected features. Enter its temporary password as **Current password** and choose a new one.
4. For later changes, select **Change password** in the header. Leave **Sign out my other sessions** checked to end other sessions. Submit **Change password**; success returns to the home page.
5. Use the header's sign-out button when finished. Closing a browser tab is not a substitute for signing out.

Passwords must be 15–128 characters. Common passwords, passwords containing `incident`, and passwords containing the username are rejected. Spaces and password-manager paste are allowed; no special mix of uppercase, numbers, or symbols is required.

Temporary passwords are shown once to the administrator, normally expire after 24 hours, and must be changed after sign-in. Ask an administrator for a new reset if yours is lost or expired. There is no email reset flow. Do not share passwords in issues, chat logs, or screen recordings.

Default sessions expire after 30 minutes idle or 8 hours total. A sixth session ends the oldest of the five existing sessions. Defaults can change through the planned settings feature. Repeated failed sign-ins can lock an account (default: five failures, 15 minutes); IP limits also apply. Wait before retrying instead of repeatedly submitting. Failure messages deliberately do not disclose whether a username exists.

## Administrator: accounts and roles

Select **Users** in the header (`/admin/users`). This page requires an administrator account with its initial password change completed (FR-1–3, SR-4–6).

- **Create user:** enter a unique username, choose `user` (reporter), `reviewer`, or `admin`, then select **Create user**. Copy the displayed temporary password, deliver it privately to the intended account holder, then select **I have copied it**. It cannot be retrieved later; use reset if lost.
- **Rename:** select **Rename**, enter the replacement username, and confirm. Inform the account holder privately that their sign-in name changed.
- **Role:** choose the new value in the account row. The change is submitted immediately. Review the selected account carefully. You cannot change your own role.
- **Deactivate / Reactivate:** select the action for the target account. Deactivation ends its sessions and blocks sign-in; reactivation allows sign-in again. Your own account cannot be deactivated here.
- **Reset password:** select the action for another account and confirm. This ends its sessions and issues a new temporary password, requiring a change at sign-in. For your own password, use **Change password** instead.

The last active administrator is protected against demotion or deactivation. If a change conflicts with another administrator's action, refresh and inspect the current state before retrying. Account records are deactivated rather than deleted, preserving audit history.

## Incident, review, comment, and settings workflows — pending integration

These are the agreed workflows from the design, not clickable instructions for this snapshot. Replace them with exact screen labels and browser-verified steps after PRs #53 and #54 merge. Missing screens on the current home page are expected.

| Role / task | Intended workflow and boundary | Completion dependency |
|---|---|---|
| Reporter: submit | Enter a title (1–200 characters), description (1–10,000), and active category; submit once and confirm the new incident. Use synthetic content only. | #54: creation and UI |
| Reporter: track | Open own incident list, inspect own details and current status. Another reporter's records must remain inaccessible. | #54: lists/detail |
| Reviewer: review/classify | Open the queue of open/under-review incidents, inspect a report, select an active category as needed, and move `open` → `under_review` → `closed`. Closed items leave the reviewer queue. | #54: classification/status/UI |
| Reviewer/admin: comment | Open an authorized incident and add a comment (1–5,000 characters). Reporters do not create comments. Confirm the saved result before retrying a failed response to avoid duplicate submissions. | #54: comments/UI |
| Admin: incidents/categories | View all incidents and manage categories; inactive categories must not be available for new reports. | #54: admin/category UI |
| Admin: audit | Filter/page audit entries by the supported controls. Entries expose actor, time, action, and target; no edit/delete action, passwords, tokens, or full descriptions. | #53: audit UI |
| Admin: settings | Edit the supported settings below and save; invalid values must be rejected. A successful update is audited. | #53: settings UI |

Planned settings limits (current defaults are enforced by `src/lib/auth/settings.ts`):

| Setting | Default | Allowed |
|---|---|---|
| Public status message | Empty | At most 280 characters; no sensitive content |
| Session idle timeout | 30 minutes | 5–60 minutes |
| Session maximum lifetime | 8 hours | 1–12 hours |
| Failed-login threshold | 5 | 3–10 |
| Lockout duration | 15 minutes | 5–60 minutes |
| Temporary-password lifetime | 24 hours | 1–72 hours |

## Troubleshooting

| Symptom | Safe next step |
|---|---|
| Missing environment variable | Confirm `.env.local` exists and include `ENV_FILE=.env.local`. Do not paste its contents into a support request. |
| Docker unavailable | Start Docker and check WSL integration if applicable; verify `docker info` succeeds. |
| Port 80/443 occupied | Identify and stop the conflicting service or old stack; do not expose the app/database ports as a workaround. |
| Certificate warning | Confirm `https://localhost`, install the CA from your own stack as above, and check whether its volume was recreated. Do not disable TLS checks. |
| Build reports an untrusted network certificate | On an authorized TLS-inspecting network, run `make ca-bundle`, then rebuild with `make up ENV_FILE=.env.local`. Only use a trusted network CA; never set a TLS-verification bypass. |
| Database rejects credentials after configuration edit | Restore the securely retained original configuration or coordinate credential rotation. Do not run reset against data you need. |
| App responds but sign-in fails after a fresh install | Check that migrations and initial account creation completed. The login screen intentionally uses a generic failure message. |
| Temporary password lost/expired, or account inactive | Contact an administrator privately for a reset or account-status check. |
| Too many attempts / busy service | Wait before retrying; ask an operator if persistent. Do not run automated retry loops. |
| Access denied / not found | Complete the required password change and confirm your role with an administrator. Do not try another account's record identifier. |
| Save conflicts or response is lost | Refresh and inspect the saved state before resubmitting. Report time, action, and request ID if available. |

For support, provide the approximate time, page, action, generic error, and request ID if displayed. Never include passwords, cookies, tokens, environment files, or full incident descriptions. Operators should inspect protected server logs locally (NFR-2, SR-9, SR-12–13).

## Demonstration and release checks

Use synthetic `demo-admin`, `demo-reviewer`, `demo-reporter`, and a second reporter, created privately through the supported flows; generate unique passwords and keep them out of the recording.

1. On the final integrated build, follow installation from a clean extracted source package and record the commit, OS, browser, and result.
2. Show login, required password change, admin creation/role/deactivation/reset, and logout. Show self-role changes are refused.
3. Once #54 lands, show reporter submission/own-record access, reviewer classification/status/comment, and admin visibility. Demonstrate denial of another reporter's record and unauthorized role actions using the [use/misuse plan](use-misuse-cases.md).
4. Once #53 lands, show the immutable audit view and bounded settings updates. Demonstrate external database access is blocked without exposing credentials.
5. Record actual outcomes in [security testing](security-testing.md), including failure recovery and 50-user testing. Do not label these steps passed without execution.

The assignment still requires a video (AC-5). The delivery plan proposes an approved live-site substitute; retain the instructor's approval before relying on that substitution. Final screen instructions, supported-OS/browser checks, release packaging inspection, and the verification dependencies (#10, #13, #14) remain prerequisites to closing #20.

# User Manual

Team #13

Requirements: NFR-8–9; FR-1–12; SR-1–14 and SR-16. See the [assignment](../ASSIGNMENT.md), [design](design.md), and [source packaging guide](source-packaging.md).

## What is available

This manual covers authentication, administrator account management, incident submission and review, comments, categories, audit history, and settings after integration of PRs #53, #54, #57, and #59. The [live deployment runbook](deployment.md) records the deployed host and executed checks. Final release verification remains tracked in [security testing](security-testing.md); these instructions do not certify every release gate.

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

The initial build can take several minutes. Run migrations before signing in. The first-administrator command prompts for a username, password, and confirmation; enter these interactively so secrets do not appear in command history. There is no default account or public registration page. Use a synthetic username such as `demo-admin`, 3–32 characters from `a-z`, `0-9`, `.`, `_`, and `-`. Usernames are normalized to lowercase. Use a unique password meeting the policy below. Subsequent accounts should be created through **Users**. Before the first incident submission, an administrator must add an active category at **Categories** (`/admin/categories`); a fresh database has none.

The local configuration contains generated plaintext credentials and must remain private and git-ignored. It is a local development convenience, not evidence that shared/deployed secret management meets SR-14. Never submit it. The committed dotenvx-encrypted `.env` configures the live hostname. Keep `ENV_FILE=.env.local` for local work; the live configuration requires its private key and is not a local replacement. On the live host, the operator uses Secrets Manager through `scripts/live-up.sh` and `scripts/live-run.sh` as described in the deployment runbook. Never put keys in a PR or report.

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

The live site uses a publicly trusted certificate; it does not require importing this local CA. See the live deployment section below.

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

Default sessions expire after 30 minutes idle or 8 hours total. A sixth session ends the oldest of the five existing sessions. Administrators can change these defaults through **Settings**. Repeated failed sign-ins can lock an account (default: five failures, 15 minutes); IP limits also apply. Wait before retrying instead of repeatedly submitting. Failure messages deliberately do not disclose whether a username exists.

## Administrator: accounts and roles

Select **Users** in the header (`/admin/users`). This page requires an administrator account with its initial password change completed (FR-1–3, SR-4–6).

- **Create user:** enter a unique username, choose `user` (reporter), `reviewer`, or `admin`, then select **Create user**. Copy the displayed temporary password, deliver it privately to the intended account holder, then select **I have copied it**. It cannot be retrieved later; use reset if lost.
- **Rename:** select **Rename**, enter the replacement username, and confirm. Inform the account holder privately that their sign-in name changed.
- **Role:** choose the new value in the account row. The change is submitted immediately. Review the selected account carefully. You cannot change your own role.
- **Deactivate / Reactivate:** select the action for the target account. Deactivation ends its sessions and blocks sign-in; reactivation allows sign-in again. Your own account cannot be deactivated here.
- **Reset password:** select the action for another account and confirm. This ends its sessions and issues a new temporary password, requiring a change at sign-in. For your own password, use **Change password** instead.

The last active administrator is protected against demotion or deactivation. If a change conflicts with another administrator's action, refresh and inspect the current state before retrying. Account records are deactivated rather than deleted, preserving audit history.

## Administrator: initialize and maintain categories

Before reporters submit, select **Categories** (`/admin/categories`). A fresh database has no categories. Enter a **Category Name** (1–100 characters), such as `Phishing` or `Other`, and select **Create Category**. Confirm the success message and that the category appears in the list.

Use **Rename Category** and **Rename** to change a name, or **Deactivate** / **Activate** to change availability. New reports and reviewer classification require an active category. Deactivation preserves existing records; it does not delete a category or its incidents.

## Reporter: submit and track incidents

1. Sign in with role `user` and select **Report Incident** (`/incidents/new`).
2. Enter **Incident Title** (1–200 characters) and **Description** (1–10,000), and select an active category. Use synthetic content only.
3. Select **Submit Incident** once and wait for **Incident submitted successfully.** If no categories are available, ask an administrator to create or activate one.
4. Select **My Incidents** (`/incidents`) to see your incident titles, statuses, and submission dates. Refresh to see review progress. This list does not display descriptions, comments, or a detail link. Other reporters' records are not available here.

## Reviewer: classify, comment, and close

1. Select **Reviewer Queue** (`/reviewer/incidents`). It contains open and under-review incidents; select an incident title to open its description and comments.
2. Select an active **Incident Category**, then **Save Category** to classify it. Confirm **Category updated successfully.**
3. Enter **Add Comment** (1–2,000 characters) and select **Post Comment**. Confirm the saved comment before retrying after a lost response.
4. Select **Start Review** to move an open incident to `under_review`, then **Close Incident** when review is complete. Only these forward transitions are supported. Closing returns to the queue and removes the incident from reviewer access.

Only reviewers can classify or change status. If another reviewer changed the status first, refresh and inspect the current state before retrying.

## Administrator: incidents, audit, and settings

Select **Incidents** (`/admin/incidents`) to view all incidents, including closed ones. Select a title to read its description and comments, and use **Add Comment** / **Post Comment** to add a comment (1–2,000 characters). Administrator incident pages have no classification or status controls; those actions require the reviewer role.

Select **Audit history** (`/admin/audit`). Records are read-only, newest first, with timestamp, actor, action, and target. Choose **Action**, **From**, and **To** filters; results update automatically. Use **Clear filters**, **Previous**, and **Next** (25 records per page). The start date must be no later than the end date. Settings changes show permitted old/new values; incident descriptions, passwords, and tokens are excluded. Login and denied-access diagnostics are in protected server logs rather than this action history.

Select **Settings** (`/admin/settings`), edit the fields below, and select **Save Changes**. The button is enabled only after a change. Confirm **Settings saved successfully.** Invalid values are rejected and successful changes are audited. Keep the status message free of sensitive information.

Settings defaults and limits:

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

## Live deployment

The grading site is [https://107-23-118-127.sslip.io](https://107-23-118-127.sslip.io). The [deployment runbook](deployment.md) is the operator procedure for provisioning, encrypted configuration, SSM access, startup, migration, updates, verification, and teardown. Its Results table records checks performed on 2026-11-24; this manual update does not claim a fresh live test.

Operators start or redeploy from the EC2 checkout with `SECRET_ID=incident-app/dotenvx-key AWS_REGION=us-east-1 make live-up`. Later commands needing the encrypted environment must use `scripts/live-run.sh`, for example `SECRET_ID=incident-app/dotenvx-key scripts/live-run.sh make logs`. Follow the runbook before operating the host. Local `.env.local` setup and CA trust steps above apply to local development.

Grader credentials are delivered privately. New or reset temporary passwords expire after the configured lifetime (default 24 hours, maximum 72); coordinate account readiness before grading. The runbook records that the deployed grader accounts have already changed their temporary passwords. Do not reset working grader accounts merely to follow this manual.

## Demonstration and release checks

Use synthetic accounts with admin, reviewer, and two reporter roles, created privately through the supported flows. For the live demonstration, use the privately supplied grader accounts. Keep passwords and session cookies off screen.

1. Record the tested commit, OS, browser, and target. For release installation verification, start from a clean extracted source package and follow the local setup above.
2. **Admin:** show login, password change, account creation, role changes, deactivation/reset, and logout using disposable demonstration accounts. Show that self-role changes are refused. Create an active category before submission.
3. **Reporter:** submit an incident and open **My Incidents**. As the live `grader-user`, open `/admin/users` (404) and `/api/admin/users` (403 JSON) to demonstrate higher-privilege denial (T-17, T-19).
4. **Reviewer:** open the queue, classify the incident, select **Start Review**, and post a comment. Try `/admin/settings` (denied). Leave closure until the admin has inspected the incident if demonstrating both views.
5. **Admin:** open the incident and its comments; show that it has no status control (T-26). Show **Users**, **Categories**, **Settings**, and **Audit history**, including incident creation, classification, status, comment, and account actions with actor/time/action/target and no descriptions.
6. **Reporter isolation:** using a second reporter's incident identifier, demonstrate the same not-found response as a missing record (T-24, T-25), following the [use/misuse plan](use-misuse-cases.md). The reporter UI provides only its own summary list.
7. **Reviewer:** select **Close Incident**, confirm it leaves the queue, then show that an admin can still inspect the closed record. Sign out of each account when finished.
8. **External database access (T-52):** from outside AWS, `nc -vz 107.23.118.127 5432` is refused or times out while `nc -vz 107.23.118.127 443` succeeds. For audit tampering (T-33), point to `tests/db/audit.test.ts` and its append-only/restricted-grant checks; do not modify the live audit log.
9. Record actual outcomes in [security testing](security-testing.md), including failure recovery and 50-user testing. Do not label these steps passed without execution.

The assignment requires a video (AC-5). The delivery plan proposes an approved live-site substitute; retain the instructor's approval before relying on that substitution. Supported-OS/browser checks, release packaging inspection, and the verification dependencies (#10, #13, #14) remain prerequisites to closing #20.

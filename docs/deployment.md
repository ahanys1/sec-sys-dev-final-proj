# Live deployment runbook (Team #13, slice 6)

One EC2 instance runs the same compose stack as local (`docker-compose.yml`, `Caddyfile`). Scope and accepted risk: AR-9 in [stride.md](stride.md). Requirements: SR-14, SR-16, ASVS V13.3.1, V12.1.1.

**Status:** live at `https://107-23-118-127.sslip.io` (us-east-1). Sections 1 to 3 done; first administrator and grader accounts (section 4) and most checks in section 5 are still to do. See Results at the bottom.

## 1. Encrypted env and key (one person, once)
Do this on a clean checkout, not on a machine with a corporate CA in `.env.local`. Needs the AWS CLI configured with permission to allocate addresses and create secrets. No instance is needed yet.

### 1a. Get the host address
Caddy needs a hostname to get an HTTPS certificate (Let's Encrypt won't certify a bare IP), and the hostname needs a fixed public IP.

1. Allocate an Elastic IP: `aws ec2 allocate-address --domain vpc` (or EC2 console, Elastic IPs, Allocate). Note `PublicIp`, for example `3.14.15.92`. It is billed hourly while unattached, so do this shortly before launching the instance.
2. Make the hostname: replace dots with dashes and append `.sslip.io`, giving `3-14-15-92.sslip.io`. sslip.io is a free public DNS service that resolves that name to the IP; nothing to sign up for. If the team owns a domain, create an A record to the IP and use that name instead.
3. This is your `SITE_ADDRESS`. It gets encrypted into `.env`, so decide it before 1b. To change it later: `npx dotenvx set SITE_ADDRESS <new> -f .env`.

The Elastic IP is attached to the instance later (section 2); it stays the same across instance restarts.

### 1b. Encrypt the env and store the key
```sh
# replace every placeholder with a random value (same as `make env-local`)
awk '/change-me/ { c = "openssl rand -hex 24"; c | getline r; close(c); sub(/change-me/, r) } { print }' .env.example > .env
# in .env set SITE_ADDRESS=<hostname from 1a> and CADDY_TLS=<your email for Let's Encrypt> (add the lines if missing)
npx dotenvx encrypt -f .env          # writes ciphertext into .env and the private key into .env.keys
grep -v '^#' .env                    # check: only encrypted: values and DOTENV_PUBLIC_KEY
git add .env                         # ciphertext only; .env.keys stays ignored (.gitignore, .dockerignore)
aws secretsmanager create-secret --name incident-app/dotenvx-key \
  --secret-string "$(grep '^DOTENV_PRIVATE_KEY=' .env.keys | cut -d= -f2- | tr -d '"')"
```
Optional: `npx dotenvx get -f .env` should print decrypted values (don't paste the output anywhere). Then delete `.env.keys` from the laptop or keep it in a password manager; if the key is lost, regenerate `.env` and re-encrypt. Never paste the key into chat, a PR or an issue. `scripts/live-up.sh` also refuses a plaintext `.env`.

## 2. Host
| Setting | Value |
|---|---|
| Instance | t3.medium (image build needs about 4 GB), Amazon Linux 2023, encrypted gp3 volume |
| Metadata | IMDSv2 required |
| Address | the Elastic IP from 1a, associated after launch: `aws ec2 associate-address --instance-id <id> --allocation-id <eipalloc-id>` |
| Key pair | **none** (no SSH) |
| Security group | inbound TCP 80 and 443 from anywhere, nothing else. Default outbound is needed for the ACME certificate and package installs. |
| IAM role | `AmazonSSMManagedInstanceCore` plus `secretsmanager:GetSecretValue` on the one secret above |
| Access | SSM Session Manager only |

### 2a. Create it
Read `scripts/aws-provision.sh`, then run it yourself: `EIP_ALLOC_ID=<eipalloc-id> sh scripts/aws-provision.sh`. It asks for confirmation, creates the security group, role, instance profile and instance, attaches the Elastic IP, and prints the instance id. Connecting needs the AWS Session Manager plugin on your machine (`session-manager-plugin`).

### 2b. Install what user data doesn't (verified on the live host, 2026-11-23)
User data installs Docker 25.0.14, git and make; buildx 0.12.2 is already present. Compose and Node are not, so in an SSM session:
```sh
sudo dnf install -y nodejs24 nodejs24-npm      # Node 24.22.3 and npm 11.19.1 from the Amazon Linux repo (engines: 24.x)

# No Compose package in the repo: pinned release binary, checksum verified before install (never pipe to a shell)
VER=v5.8.0
cd "$(mktemp -d)"
curl -fsSLO https://github.com/docker/compose/releases/download/$VER/docker-compose-linux-x86_64
curl -fsSLO https://github.com/docker/compose/releases/download/$VER/docker-compose-linux-x86_64.sha256
sha256sum -c docker-compose-linux-x86_64.sha256     # must print OK; also compare with the release page
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo install -m 0755 docker-compose-linux-x86_64 /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version                              # v5.8.0

sudo usermod -aG docker ssm-user                    # then reconnect; root-equivalent, accepted under AR-1

# Compose v5.8.0 needs buildx 0.17.0 or newer; the AL2023 package is 0.12.2. Same pattern, checksums.txt from the release:
VER=v0.39.0
cd "$(mktemp -d)"
curl -fsSLO https://github.com/docker/buildx/releases/download/$VER/buildx-$VER.linux-amd64
curl -fsSLO https://github.com/docker/buildx/releases/download/$VER/checksums.txt
grep "buildx-$VER.linux-amd64\$" checksums.txt | sha256sum -c     # must print OK
sudo install -m 0755 buildx-$VER.linux-amd64 /usr/local/lib/docker/cli-plugins/docker-buildx   # searched before the package's copy
```
Work in your home directory (`cd ~`) before cloning; the session starts somewhere `ssm-user` can't write.

## 3. Start
In an SSM session:
```sh
git clone https://github.com/ahanys1/sec-sys-dev-final-proj.git && cd sec-sys-dev-final-proj
git checkout <release tag or main>
SECRET_ID=incident-app/dotenvx-key AWS_REGION=<region> make live-up
SECRET_ID=incident-app/dotenvx-key scripts/live-run.sh make create-admin   # first administrator; prompts
```
Every later `make` command that reads `.env` (`create-admin`, `logs`, `down`, `up`, `migrate`) needs the key too, because only `live-up.sh` supplies it by itself. Run them through `scripts/live-run.sh` as above. Without the key the Makefile now stops with a decryption error (`dotenvx run --strict`) instead of starting containers with ciphertext as their settings.
`scripts/live-up.sh` checks `.env` is encrypted, runs `npm ci --ignore-scripts`, reads the key from Secrets Manager into the process environment only, runs `make migrate` then `make up`, and fails if the database publishes a port or any container has `DOTENV_PRIVATE_KEY` in its environment.

## 4. Grader accounts (ASSUMP-2)
First, as an admin, add incident categories at `/admin/categories`. A fresh database has none (no seed data on the live host, T-63), and without one a user can't submit an incident. Use generic names, for example Phishing, Malware, Data exposure, Physical security, Other.

Create a reviewer, a user (the role that submits incidents) and a grader admin on the admin screen. Each gets a one-time temporary password and must change it at first login. Send the credentials to the instructor privately; never commit them.

**Temporary passwords expire** after `tempPasswordHours` (default 24, maximum 72, set on the admin settings page). An expired one is refused at login (`app/api/auth/login/route.ts`), so an instructor who logs in late is locked out until an admin resets the account. Before submitting, raise the setting to 72 and reset the grader accounts so the clock starts then, or set the final passwords yourself and share those. The users page shows each account's expiry.

## 5. Verify (run from outside AWS)
| Check | Command | Expect | Threat |
|---|---|---|---|
| Open ports | `nmap -Pn -p- <host>` | only 80 and 443 | T-52 |
| Database | `psql -h <host> -p 5432 -U postgres` | connection refused or timeout | T-52 |
| Redirect | `curl -sI http://<host>` | redirect to `https://` | T-06 |
| Headers | `curl -sI https://<host>` | `strict-transport-security`, CSP | T-06 |
| TLS | `nmap --script ssl-enum-ciphers -p 443 <host>` | TLS 1.2 and 1.3 only | T-06 |
| Key on host | `ls -a ~ . \| grep env.keys` | no `.env.keys` | AR-5 |
| Key in image | `docker history --no-trunc <app image> \| grep -c DOTENV_PRIVATE_KEY` | `0` | AR-5 |
| Roles | log in as each role; try an admin API as a user, another user's incident | 403 or 404. Denials are not audit events (FR-11 lists none); logins appear in the server log (`auth.login.ok`, `auth.login.failed`) | T-17, T-19, T-24 |

### Demo script (for the video; move to `docs/user-manual.md` once #55 merges)
Use the grader accounts. Never show a password or session cookie on screen.
1. **User:** log in as `grader-user`, submit an incident (pick a category), open the own-incident list.
2. **Misuse, higher-privilege access (T-17, T-19):** still as `grader-user`, open `/admin/users` (404 page) and `/api/admin/users` (403 JSON).
3. **Reviewer:** log in as `grader-reviewer`, open the queue, move the incident to under review, add a comment, classify it. Open an admin page (denied).
4. **Misuse, unauthorized action (T-26):** as `grader-reviewer`, try the admin settings page (denied). As `grader-admin`, open `/admin/incidents/<id>`: it has no status control, because only reviewers may change status (`app/reviewer/incidents/[id]/StatusControls.tsx`; the status API allows the reviewer role only, design §3).
5. **Misuse, another user's record (T-24):** as `grader-user`, open another user's incident ID: same 404 as a missing one (T-25).
6. **Admin:** log in as `grader-admin`, show the users page (create a user, role change), categories, settings, and the audit view listing the actions from steps 1 to 3 (actor, time, action, target; no descriptions).
7. **External database access (T-52):** from a laptop outside AWS, `nc -vz 107.23.118.127 5432` (or `psql -h ...`) is refused or times out; `nc -vz 107.23.118.127 443` succeeds.
8. **Audit tampering (T-33):** not shown live. Point to `tests/db/audit.test.ts` (append-only trigger and restricted `app_user` grants).

## 6. Redeploy from `main`
Works once this branch is merged. It needs three things to still exist: the encrypted `.env` on `main`, the key (secret `incident-app/dotenvx-key`, or the `.env.keys` backup in the password manager), and the Elastic IP, because `SITE_ADDRESS` in `.env` is tied to it. If the IP was released, redo 1a and re-encrypt with a new `SITE_ADDRESS`.

| Situation | Do |
|---|---|
| Instance stopped | Start it. Docker starts at boot and the containers restart themselves; data is kept. |
| Instance terminated | Delete the old security group, role and instance profile named `incident-app`, then run `scripts/aws-provision.sh` (2a), the installs in 2b, and `git clone` + `git checkout main`, then `make live-up` (3). Grader accounts and incidents are gone with the disk: redo section 4. |
| Secret deleted | Recreate it from the `.env.keys` backup (1b, last command). With no backup, regenerate `.env` and re-encrypt (1b). |

Budget about half an hour. Re-run the section 5 checks afterwards.

## 7. Teardown (after grading)
Terminate the instance, release the Elastic IP, delete the secret. The data is demo data only. Keep the secret and the IP until grading ends if you may need a redeploy (section 6).

## Results
| Check | Date | Result |
|---|---|---|
| Stack up via `make live-up` (migrations applied; script's db-port and key-in-container checks passed) | 2026-11-24 | Pass |
| Redirect: `curl -I http://107-23-118-127.sslip.io` | 2026-11-24 | 308 to `https://` (Caddy) |
| HTTPS with a trusted certificate (curl without `-k`), HSTS, CSP, nosniff, frame-deny headers | 2026-11-24 | Pass |
| Port spot check from outside with `nc` (not a full `nmap -p-`): 22, 3000, 5432, 2375 | 2026-11-24 | Closed or filtered; 80 and 443 open |
| TLS versions with `openssl s_client`: 1.2 and 1.3 accepted; 1.0 and 1.1 refused with a `protocol version` alert | 2026-11-24 | Pass (not a full cipher scan) |
| First administrator created; site loads and login works | 2026-11-24 | Pass (reported by the operator) |
| Accounts created on the live site: own admin, `grader-admin`, `grader-reviewer`, `grader-user` ; each logged in once and its temporary password replaced with a final one, so expiry no longer applies | 2026-11-24 | Done (reported by the operator) |
| Role checks in the browser as `grader-user`, `grader-reviewer`, `grader-admin`; audit page lists the FR-11 actions (incident create, status, classify, comments, user create, password change, category create) | 2026-11-24 | Pass (reported by the operator, screenshot reviewed). Logins and denied access are not in the audit table by design; V16.3.2 (denied access logging) not found in the code |
| On the host: no `.env.keys` file (`ls -a ~ ~/sec-sys-dev-final-proj \| grep env.keys` printed nothing); app image history has no `DOTENV_PRIVATE_KEY` (`grep -c` printed 0) | 2026-11-24 | Pass (reported by the operator) |
| Full TCP scan from outside: `nmap -Pn -p- -T4 --max-retries 1 107.23.118.127` | 2026-11-24 | Pass: only 80 and 443 open. Caveat: run from a personal laptop off the corporate VPN, yet 53,276 ports showed as closed (connection refused) rather than filtered and latency was 2 ms, which a security group would not produce; cause not identified (something on the scanner's path may be answering). An earlier `nc` check from a different network timed out on 22, 3000, 5432 and 2375, as a security group drops packets. Only 80 and 443 answered as open in both. |
| `nmap --script ssl-enum-ciphers -p 443` full cipher scan; `psql` refusal | | Not run (TLS versions spot-checked with `openssl`; database port checked with `nc`) |

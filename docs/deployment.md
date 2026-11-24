# Live deployment runbook (Team #13, slice 6)

One EC2 instance runs the same compose stack as local (`docker-compose.yml`, `Caddyfile`). Scope and accepted risk: AR-9 in [stride.md](stride.md). Requirements: SR-14, SR-16, ASVS V13.3.1, V12.1.1.

**Status: runbook only. Nothing here has been run against AWS yet; the Results table at the bottom is empty until it is.**

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

Install on the host: Docker, the Docker Compose v2 plugin, git, make, and Node 24 (`engines` in `package.json`).

## 3. Start
In an SSM session:
```sh
git clone https://github.com/ahanys1/sec-sys-dev-final-proj.git && cd sec-sys-dev-final-proj
git checkout <release tag or main>
SECRET_ID=incident-app/dotenvx-key AWS_REGION=<region> make live-up
make create-admin                      # first administrator; prompts
```
`scripts/live-up.sh` checks `.env` is encrypted, runs `npm ci --ignore-scripts`, reads the key from Secrets Manager into the process environment only, runs `make migrate` then `make up`, and fails if the database publishes a port or any container has `DOTENV_PRIVATE_KEY` in its environment.

## 4. Grader accounts (ASSUMP-2)
Create a reviewer, a reporter and a grader admin on the admin screen. Each gets a one-time temporary password and must change it at first login. Send the credentials to the instructor privately; never commit them.

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
| Roles | log in as each role; try an admin API as reporter, another user's incident | 403 or 404, audit row written | T-17, T-19, T-24 |

## 6. Teardown (after grading)
Terminate the instance, release the Elastic IP, delete the secret. The data is demo data only.

## Results
| Check | Date | Result |
|---|---|---|
| (not run yet) | | |

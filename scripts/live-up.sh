#!/bin/sh
# Start the live stack on the EC2 host (docs/deployment.md; SR-14, ASVS V13.3.1, AR-5).
# The dotenvx private key is read from AWS Secrets Manager into this process's environment only:
# never written to disk, never echoed, never passed to a container.
# Usage: SECRET_ID=<name-or-arn> AWS_REGION=<region> make live-up
set -eu
cd "$(dirname "$0")/.."

: "${SECRET_ID:?set SECRET_ID to the Secrets Manager secret holding DOTENV_PRIVATE_KEY}"
ENV_FILE="${ENV_FILE:-.env}"

# SR-14: refuse a plaintext env file. Every value except the public key must be dotenvx ciphertext.
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found"; exit 1; }
if grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENV_FILE" | grep -v '^DOTENV_PUBLIC_KEY' | grep -qv '="\{0,1\}encrypted:'; then
  echo "$ENV_FILE has plaintext values; run 'npx dotenvx encrypt -f $ENV_FILE' first (SR-14)"
  exit 1
fi

# Lockfile install, no lifecycle scripts: keeps the pinned dotenvx and runs no package code on the host.
npm ci --ignore-scripts --no-audit --no-fund

DOTENV_PRIVATE_KEY="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" \
  --query SecretString --output text)"
export DOTENV_PRIVATE_KEY

# Migrate first (owner role, starts the db), then bring up the app and Caddy.
make migrate ENV_FILE="$ENV_FILE"
make up ENV_FILE="$ENV_FILE"

# Post-start checks: only Caddy publishes ports (T-52), and the key is not in any container (AR-5).
docker compose ps --format '{{.Service}} {{.Ports}}' | grep -E '^db .*->' && { echo "db publishes a port"; exit 1; }
for c in $(docker compose ps -q); do
  docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$c" | grep -q '^DOTENV_PRIVATE_KEY=' \
    && { echo "DOTENV_PRIVATE_KEY found in a container environment"; exit 1; }
done
echo "Live stack is up. Create the first admin with: make create-admin"

#!/bin/sh
# Run one command with the dotenvx key from Secrets Manager in its environment only (SR-14, AR-5).
# Usage: SECRET_ID=incident-app/dotenvx-key scripts/live-run.sh make create-admin
set -eu
cd "$(dirname "$0")/.."
: "${SECRET_ID:?set SECRET_ID to the Secrets Manager secret holding DOTENV_PRIVATE_KEY}"
[ "$#" -gt 0 ] || { echo "usage: live-run.sh <command> [args]"; exit 1; }
DOTENV_PRIVATE_KEY="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text)"
export DOTENV_PRIVATE_KEY
exec "$@"

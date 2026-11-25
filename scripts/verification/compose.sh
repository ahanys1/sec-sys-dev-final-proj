#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
# Fixed isolated project and private runtime env; never targets the existing local/live stack.
exec docker compose --env-file /tmp/team13-slice7/runtime.env -p team13-slice7 -f docker-compose.yml -f scripts/verification/compose.yaml "$@"

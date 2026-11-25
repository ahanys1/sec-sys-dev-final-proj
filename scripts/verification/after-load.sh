#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
cp /tmp/team13-slice7/k6-summary.json /tmp/team13-slice7/k6-single-ip-summary.json
scripts/verification/compose.sh build app create-admin > /tmp/team13-slice7/rebuild.log 2>&1
scripts/verification/compose.sh up -d app
scripts/verification/compose.sh run --rm create-admin npx tsx scripts/verification/refresh.ts
scripts/verification/distributed-load.sh > /tmp/team13-slice7/k6-distributed.log 2>&1 || true
python3 scripts/verification/recovery.py
scripts/verification/compose.sh run --rm create-admin npx tsx scripts/verification/refresh.ts
python3 scripts/verification/zap-roles.py

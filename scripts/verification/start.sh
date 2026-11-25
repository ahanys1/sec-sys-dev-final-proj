#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
# Refuse to overwrite a previous run's credentials/results.
test ! -e /tmp/team13-slice7/runtime.env || { echo 'Existing verification runtime: use compose.sh to resume.'; exit 1; }
mkdir -p /tmp/team13-slice7
chmod 700 /tmp/team13-slice7
python3 - <<'PY'
import secrets,os
p='/tmp/team13-slice7/runtime.env'
with open(p,'w') as f:
 for k in ['POSTGRES_PASSWORD','APP_OWNER_PASSWORD','APP_USER_PASSWORD']:f.write(k+'='+secrets.token_hex(24)+'\n')
 f.write('POSTGRES_USER=bootstrap_admin\nSITE_ADDRESS=https://verify.local\nCADDY_TLS=internal\nEXTRA_CA_CERT='+os.environ.get('EXTRA_CA_CERT','/dev/null')+'\n')
os.chmod(p,0o600)
PY
scripts/verification/compose.sh build app migrate create-admin
scripts/verification/compose.sh up -d db
scripts/verification/compose.sh run --rm migrate
scripts/verification/compose.sh run --rm create-admin npx tsx scripts/verification/seed.ts
scripts/verification/compose.sh up -d app caddy

# Trust the isolated Caddy issuer explicitly in Python verification clients.
for attempt in $(seq 1 30); do
  if docker cp team13-slice7-caddy-1:/data/caddy/pki/authorities/local/root.crt /tmp/team13-slice7/local-ca.crt 2>/dev/null; then exit 0; fi
  sleep 1
done
echo 'Local Caddy CA was not ready after 30 seconds.' >&2
exit 1

#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
mkdir -p /tmp/team13-slice7
chmod 700 /tmp/team13-slice7
docker run --rm -v "$PWD:/src:ro" -v /tmp/team13-slice7:/results -w /src \
 semgrep/semgrep@sha256:67518c174185a2043fdbed16c70631b79209499b3671178e7194379b48295a0d \
 semgrep scan --exclude scripts/security --config p/typescript --config p/nextjs --config p/owasp-top-ten --error --json --output /results/semgrep.json

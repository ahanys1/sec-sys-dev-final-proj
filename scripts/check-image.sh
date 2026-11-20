#!/bin/sh
# Build the runtime and migrate images and assert the runtime image is hardened (T-61, V13.4.1, V15.2.3):
# non-root, and no env files, git data, or source maps. Used by CI and `make check-image`.
# On a TLS-inspecting network: EXTRA_CA_CERT=./ca-bundle.pem make check-image
# SKIP_BUILD=1 reuses existing secproj-app:check and secproj-migrate:check images.
set -eu
cd "$(dirname "$0")/.."

APP=secproj-app:check
MIGRATE=secproj-migrate:check

if [ "${SKIP_BUILD:-}" != "1" ]; then
  SECRET=""
  if [ -n "${EXTRA_CA_CERT:-}" ]; then SECRET="--secret id=extra_ca,src=$EXTRA_CA_CERT"; fi
  # shellcheck disable=SC2086
  docker build $SECRET --target runner -t "$APP" .
  # shellcheck disable=SC2086
  docker build $SECRET --target migrate -t "$MIGRATE" .
fi

fail() { echo "FAIL: $1" >&2; exit 1; }

for image in "$APP" "$MIGRATE"; do
  uid=$(docker run --rm --entrypoint id "$image" -u)
  [ "$uid" != "0" ] || fail "$image runs as root"
done

leftovers=$(docker run --rm --entrypoint sh "$APP" -c \
  'find / -xdev \( -name ".env*" -o -name ".git" -o -name "*.map" \) -not -path "*/node_modules/*" 2>/dev/null || true')
[ -z "$leftovers" ] || fail "runtime image contains: $leftovers"

echo "check-image: ok"

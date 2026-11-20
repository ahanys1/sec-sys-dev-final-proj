#!/bin/sh
# Throwaway Postgres (same image and role setup as the stack), migrate, run tests/db, clean up.
# Binds 127.0.0.1 only and is removed on exit. Needs Docker and openssl.
set -eu
cd "$(dirname "$0")/.."

IMAGE=$(grep -oE 'postgres:18-alpine@sha256:[0-9a-f]+' docker-compose.yml)
NAME=secproj-test-db
PORT=55432
BOOT_PW=$(openssl rand -hex 12)
OWNER_PW=$(openssl rand -hex 12)
APP_PW=$(openssl rand -hex 12)

docker rm -f "$NAME" >/dev/null 2>&1 || true
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

docker run -d --name "$NAME" -p "127.0.0.1:$PORT:5432" \
  -e POSTGRES_USER=bootstrap_admin -e POSTGRES_PASSWORD="$BOOT_PW" \
  -e APP_OWNER_PASSWORD="$OWNER_PW" -e APP_USER_PASSWORD="$APP_PW" \
  -v "$PWD/docker/postgres/init:/docker-entrypoint-initdb.d:ro" "$IMAGE" >/dev/null

# Poll over TCP: the init-phase server only listens on the socket, so this waits for init to finish.
until docker exec -e PGPASSWORD="$OWNER_PW" "$NAME" psql -h 127.0.0.1 -U app_owner -d incidents -c 'select 1' >/dev/null 2>&1; do
  sleep 1
done

DATABASE_URL="postgresql://app_owner:$OWNER_PW@127.0.0.1:$PORT/incidents" npx prisma migrate deploy
TEST_DATABASE_OWNER_URL="postgresql://app_owner:$OWNER_PW@127.0.0.1:$PORT/incidents" \
TEST_DATABASE_APP_URL="postgresql://app_user:$APP_PW@127.0.0.1:$PORT/incidents" \
  npx vitest run tests/db

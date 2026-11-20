#!/bin/sh
# First-boot only. Separates the migration owner from the runtime app role (T-42, V13.2.2).
# POSTGRES_USER is a bootstrap superuser that the app and migrations never use.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_pw="$APP_OWNER_PASSWORD" -v app_pw="$APP_USER_PASSWORD" <<'SQL'
CREATE ROLE app_owner LOGIN PASSWORD :'owner_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE app_user  LOGIN PASSWORD :'app_pw'   NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE incidents OWNER app_owner;
REVOKE ALL ON DATABASE incidents FROM PUBLIC;
GRANT CONNECT ON DATABASE incidents TO app_user;
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname incidents <<'SQL'
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO app_owner;
GRANT USAGE ON SCHEMA public TO app_user;
SQL

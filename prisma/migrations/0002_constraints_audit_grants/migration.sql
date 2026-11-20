-- Hand-written constraints that Prisma can't express, plus the app role's least-privilege grants.
-- The roles are created by docker/postgres/init/01-roles.sh. Add grants here for every new table.

-- Singleton settings row (threat-model §1.4.1).
ALTER TABLE "settings" ADD CONSTRAINT "settings_singleton" CHECK ("id" = 1);

-- Normalized usernames, enforced again at the database (SR-7; design §4).
ALTER TABLE "users" ADD CONSTRAINT "users_username_format" CHECK ("username" ~ '^[a-z0-9._-]{3,32}$');

-- Case-insensitive unique category names (design §4).
CREATE UNIQUE INDEX "categories_name_lower_key" ON "categories" (lower("name"));

-- Audit actor shape: a user actor needs a user ID, the system actor has none (DC-3, NH-4).
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_check"
  CHECK (("actor_type" = 'user' AND "user_id" IS NOT NULL) OR ("actor_type" = 'system' AND "user_id" IS NULL));

-- Append-only audit log (FR-12, SR-11, T-33): reject UPDATE, DELETE, and TRUNCATE for every role.
CREATE FUNCTION "audit_log_reject_change"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;
CREATE TRIGGER "audit_log_append_only" BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION "audit_log_reject_change"();
CREATE TRIGGER "audit_log_no_truncate" BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_log_reject_change"();

-- App role: SELECT/INSERT/UPDATE on business tables, INSERT/SELECT on audit_log,
-- DELETE only on sessions and login_attempts (design §7; T-42, V13.2.2).
GRANT SELECT, INSERT, UPDATE ON "users", "incidents", "comments", "categories", "settings" TO app_user;
GRANT SELECT, INSERT ON "audit_log" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "sessions", "login_attempts" TO app_user;
GRANT USAGE ON SEQUENCE "audit_log_id_seq", "login_attempts_id_seq" TO app_user;

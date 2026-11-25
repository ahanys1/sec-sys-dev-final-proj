-- SR-2/3, ASVS V6.4.1, A-6: consume temporary credentials atomically with session creation.
ALTER TABLE "users" ADD COLUMN "temp_password_used_at" TIMESTAMPTZ(3);

-- Existing temporary-password sessions already represent a successful first use.
UPDATE "users" AS u SET "temp_password_used_at" = s.first_use
FROM (SELECT "user_id", MIN("created_at") AS first_use FROM "sessions" GROUP BY "user_id") AS s
WHERE u."id" = s."user_id" AND u."must_change_password";

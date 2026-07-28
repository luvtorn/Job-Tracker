UPDATE "users"
SET "email_verified" = true
WHERE "email_verified" = false
  AND "created_at" < TIMESTAMP '2026-07-28 21:59:34.280';

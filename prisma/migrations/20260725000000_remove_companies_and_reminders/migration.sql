ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_companyId_fkey";
DROP INDEX IF EXISTS "contacts_companyId_idx";
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "companyId";

DROP TABLE IF EXISTS "reminders";
DROP TABLE IF EXISTS "companies";

# Testing

The default test suite is database-safe and never connects to the development or production database.

Database integration tests require a separate migrated PostgreSQL database. Set `TEST_DATABASE_URL` to a connection string whose database or branch name contains `test`, apply the existing Prisma migrations to that database, and then run `npm test`. The name guard prevents accidentally running destructive cleanup against a non-test database.

Browser E2E tests require Playwright. Add it only together with an intentionally regenerated and reviewed lock file; the current roadmap explicitly preserves the user's existing `package-lock.json`.

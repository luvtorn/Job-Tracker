# Testing

The default test suite is database-safe and never connects to the development or production database.

Database integration tests require a separate migrated PostgreSQL database. Set `TEST_DATABASE_URL` to a connection string whose database or branch name contains `test`, apply the existing Prisma migrations to that database, and then run `npm test`. The name guard prevents accidentally running destructive cleanup against a non-test database.

Browser E2E tests require Playwright. Add it only together with an intentionally regenerated and reviewed lock file; the current roadmap explicitly preserves the user's existing `package-lock.json`.

The read-only browser smoke can also use a trusted external Playwright runtime without changing dependencies. Start the production server, set `E2E_BASE_URL`, `PLAYWRIGHT_NODE_PATH`, and optionally `PLAYWRIGHT_EXECUTABLE_PATH`, then run `npm run test:browser-smoke`. It verifies real Chromium rendering, locale selection, hydration/CSP errors, and HTTP 5xx responses for `en`, `pl`, and `ru`.

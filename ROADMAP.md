# JobTracker Roadmap

JobTracker is developed as a production-ready job application and recruitment workspace. AI features are intentionally outside this roadmap.

## Quality gate

Every stage must pass:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- migration status without pending migrations
- manual checks for English, Polish, and Russian

## Completed

- [x] Dashboard and workspace localization on `en`, `pl`, and `ru`
- [x] Vacancy-aware candidate navigation
- [x] One editable and removable interview event without duplicates
- [x] Full localization and UX audit
- [x] Debounced jobs search, card/table views, wishlist, vacancy validation, and note tags
- [x] Stable registration, logout, notifications, and jobs navigation
- [x] Route/service/repository boundaries, request validation, security headers, CSRF checks, and test foundation
- [x] Email registration with immediate session and required email verification
- [x] Resend verification and password reset with hashed one-time tokens
- [x] Google and GitHub sign-in, registration, and connected sign-in methods
- [x] Separate Google Calendar consent and encrypted offline token storage
- [x] Automatic or manual Google Meet interviews with optional candidate invitations
- [x] Idempotent Calendar synchronization, durable retry records, and manual fallback

## Production release

- [x] CI for migrations, unit/integration tests, lint, TypeScript, build, and browser smoke
- [x] Production OAuth/Resend/Calendar configuration guide
- [x] Privacy notice for connected accounts, email delivery, and Calendar access
- [ ] Configure production provider credentials and exact callback URLs
- [ ] Verify migrations and restore procedure on a staging Neon branch
- [ ] Run real Google, GitHub, Resend, and Calendar smoke tests
- [ ] Run Chrome and Edge desktop/mobile acceptance tests
- [ ] Enable privacy-safe production error monitoring

## Delivery rules

- Keep route handlers thin: route → service → repository → database.
- Validate all external input with Zod.
- Never log secrets, OAuth codes, Meet links, document contents, or personal messages.
- Preserve unrelated working-tree changes and use a separate Conventional Commit for each stage.

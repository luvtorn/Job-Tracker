# JobTracker Roadmap

This roadmap tracks the production-readiness plan. A stage is complete only after tests, lint, typecheck, build, and the relevant `en`, `pl`, and `ru` flows pass.

## Quality gate

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Manual role, locale, accessibility, loading, empty, and error-state checks

## Stages

- [x] Stage 0 — Baseline dashboard/reminders localization and vacancy-aware candidates navigation
- [x] Stage 1 — Single-source calendar interviews and complete event editing
- [ ] Stage 2 — Full localization and UX audit
- [ ] Stage 3 — Architecture, security, integration tests, and critical E2E coverage
- [ ] Stage 4 — Opt-in WebGPU/WebLLM browser runtime
- [ ] Stage 5 — Versioned AI generation history
- [ ] Stage 6 — Match analysis, cover letter, candidate summary, and read-only assistant
- [ ] Stage 7 — AI validation, browser compatibility, privacy-safe telemetry, and beta release
- [ ] Stage 8 — CI, production hardening, staging migration checks, and post-validation monetization research

## Baseline recorded on 2026-07-22

- Tests: 23 passed, 0 failed
- ESLint: passed
- TypeScript: passed
- Next.js production build: passed
- `/candidates?vacancyId=<id>` selects an accessible vacancy and safely falls back for missing or unauthorized IDs
- Dashboard and shared reminders use typed `en`, `pl`, and `ru` translations

## Delivery rules

- Keep route handlers thin: route → service → repository → database.
- Validate request bodies, route params, query params, and stored AI output with Zod.
- Never send CV text, vacancy context, or prompts to an operator-funded AI service.
- Never rank candidates or produce an automatic hiring decision.
- Preserve unrelated working-tree changes and commit each completed stage separately.

---
inclusion: always
---

# Transferly Project Conventions

## Repository Structure

Three packages — never mix concerns across them:

- `api/` — Node.js, CommonJS, Express, SQLite, Redis/BullMQ, Zod, Pino
- `bot/` — Telegram operations bot (grammY-style commands/callbacks, SQLite)
- `miniapp/` — Vite, React, Tailwind CSS, Supabase client, Playwright e2e

Run package-manager commands with `--prefix api`, `--prefix bot`, or `--prefix miniapp`.

## Layer Ownership

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Transport | `api/routes/`, `api/controllers/` | HTTP, request parsing, response shaping |
| Business logic | `api/services/` | Validation, orchestration, external calls |
| Persistence | `api/repositories/` | All SQL queries |
| Side effects | `api/jobs/`, `api/webhooks/` | BullMQ workers, webhook handlers |
| Validation schemas | `api/schemas/` | Zod schemas for all API inputs |
| Adapters | `api/adapters/` | External provider clients (PayPal, Stripe) |

Do not put SQL in services. Do not put business logic in controllers. Do not put HTTP concerns in repositories.

## Code Style

- CommonJS (`require`/`module.exports`) everywhere in `api/` and `bot/`
- ESM only in `miniapp/` (Vite/React)
- Validate all external inputs with Zod at API boundaries; strip unknown fields
- Log with Pino (`api/utils/logger.js`) — structured, never raw `console.log` in production paths
- Use `api/utils/sanitizeRequestUrl.js` before logging any request URLs

## Adding a New API Endpoint

1. Define Zod schema in `api/schemas/`
2. Add repository methods in `api/repositories/` if new data access needed
3. Write service logic in `api/services/`
4. Create controller in `api/controllers/`
5. Register route in `api/routes/` and `api/routes/index.js`
6. Write tests in `api/test/`

## Git & PR Conventions

- Branch names: `feature/`, `fix/`, `refactor/`, `docs/` prefixes
- Commit scope tags: `[api]`, `[bot]`, `[miniapp]`
- PRs: clear description, link issues, all checks passing before merge
- Never force-push to `main`/`master`

## Verification Order (fastest first)

```bash
# API
npm run lint --prefix api
npm run db:migrate --prefix api
npm test --prefix api

# Bot
npm test --prefix bot

# MiniApp
npm run build --prefix miniapp
npm run test:e2e --prefix miniapp

# Release gate (all packages)
npm run verify:release
```

`INLINE_QUEUE_MODE=true` is for tests only — never set in production.

## What Never Goes in Logs or Reports

- PayPal client secrets, bearer tokens, webhook headers
- Raw sensitive payloads, user emails, card/account numbers
- Any value from `.env` files

## Secrets & Dependencies

- Run `npm audit --omit=dev --prefix <package>` when adding or updating dependencies
- Never commit `.env` files, production SQLite databases, or service-role keys
- Run `npm run scan:secrets` before any release-bound commit

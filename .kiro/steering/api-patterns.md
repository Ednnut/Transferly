---
inclusion: fileMatch
fileMatch: "api/**"
---

# API Development Patterns

These patterns apply when working in the `api/` package.

## Module Trace Order

When touching any API behavior, trace the full stack before editing:

```
routes/ → controllers/ → services/ → repositories/ → schemas/ → jobs/ → tests/
```

For payment, webhook, or provider behavior, also check `api/adapters/` and `api/webhooks/`.

## Provider Architecture

Payment providers live in `api/providers/<name>/`. Each implements the base interface from `api/providers/base-provider.js` and registers in `api/providers/registry.js`.

Current providers: `paypal/`, `stripe/`, `wise/`, `flutterwave/`, `paystack/`, `crypto/`.

Use `providerCapabilityService` to check what a provider supports before calling it. Use `paymentProviderRegistry` to resolve providers dynamically.

## Key Service Responsibilities

| Service | What it owns |
|---------|-------------|
| `ledgerService` | All wallet balance mutations |
| `paypalInvoiceService` | PayPal invoice create/send/fetch |
| `paypalPayoutService` | PayPal payout submit/track |
| `providerPayoutService` | Multi-provider payout dispatch |
| `riskService` | Risk evaluation before payouts |
| `webhookService` | PayPal webhook verify & dispatch |
| `auditLogService` | Immutable action trail |
| `deadLetterService` | Failed job inspection |
| `bootstrapService` | User/wallet provisioning |

## BullMQ Jobs

- Queue definitions: `api/jobs/queues.js`
- Worker entry: `api/jobs/worker.js`
- Job dispatchers: `api/jobs/dispatchers.js`
- Use `INLINE_QUEUE_MODE=true` in tests to run jobs synchronously
- Always handle job failure with dead-letter queue routing

## Database Patterns

- Migration files: `api/db/migrations/`
- Run migrations: `npm run db:migrate --prefix api`
- SQLite transactions: use `db.serialize()` with `BEGIN`/`COMMIT`/`ROLLBACK` for any multi-step write
- Seed: `npm run db:seed --prefix api` creates demo user + wallet from `SEED_*` env vars

## Testing

- Test runner: `node --test` (built-in Node.js test runner, not Jest/Mocha)
- Tests: `api/test/`
- Setup file: `api/test/setup-test-env.js`
- Run with `--test-concurrency=1` to avoid SQLite write conflicts
- `api.integration.test.js` covers full request→response flows with a real in-memory DB

## Config & Environment

All operational defaults live in `api/config.js`. Never hardcode values that should be configurable.

Required env vars (fail-fast at startup if missing):
- `REDIS_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`

## Middleware Order

The middleware chain in `api/app.js`:
1. Rate limiting (`express-rate-limit`)
2. Helmet security headers
3. CORS
4. Body parsing (raw body preserved for webhook signature verification)
5. Request context (`requestContext.js`)
6. Observability (`observability.js`)
7. Auth (`authenticateRequest.js`)
8. Routes
9. Error handler (`errorHandler.js`)

## ESLint

```bash
npm run lint --prefix api
```

Config: `api/eslint.config.mjs`. Fix linting errors before committing.

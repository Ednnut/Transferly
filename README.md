# Flashing

Production-grade PayPal invoicing and payouts backend built with Node.js, CommonJS, Express, SQLite, Redis, BullMQ, and Zod. The active backend package now lives entirely under `api/`, while the repo root keeps project docs and the `slipcrafts/` frontend workspace.

## Stack

- Runtime: Node.js + CommonJS
- HTTP: Express
- Database: SQLite
- Queueing: Redis + BullMQ
- Validation: Zod
- Logging: Pino

## Architecture

Primary modules:

- `paypalInvoiceService`
- `paypalPayoutService`
- `ledgerService`
- `riskService`
- `webhookService`
- `auditLogService`

Project structure:

```text
api/
  adapters/
  app.js
  config.js
  controllers/
  db/
  jobs/
  middleware/
  presenters/
  repositories/
  routes/
  schemas/
  services/
  start/
  utils/
  webhooks/
docs/codex/references/
slipcrafts/
```

The ledger remains the source of truth for balances. PayPal changes external state, but wallet values come from `wallets` plus `ledger_entries`, not from provider status alone.

## API Routes

- `POST /api/invoices`
- `GET /api/invoices/:id`
- `GET /api/invoices`
- `POST /api/payouts`
- `GET /api/payouts/:id`
- `GET /api/payouts`
- `POST /api/admin/payouts/:id/approve`
- `POST /api/admin/payouts/:id/reject`
- `GET /api/admin/payouts`
- `GET /api/admin/risk-flags`
- `GET /api/admin/webhooks`
- `GET /api/admin/queues`
- `GET /api/admin/dead-letters`
- `POST /api/admin/invoices/:id/release`
- `POST /webhooks/paypal`

## Environment

Copy `api/.env.example` to `api/.env` and provide real credentials.

Required variables:

- `SQLITE_DATABASE_PATH`
- `REDIS_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENVIRONMENT`
- `PAYPAL_WEBHOOK_ID`

Optional policy controls:

- `MAX_SINGLE_PAYOUT`
- `DAILY_PAYOUT_LIMIT`
- `MAX_PAYOUTS_PER_HOUR`
- `HIGH_RISK_COUNTRIES`
- `HIGH_RISK_CURRENCIES`
- `SUSPICIOUS_INVOICE_KEYWORDS`
- `API_RATE_LIMIT_MAX`
- `API_RATE_LIMIT_WINDOW_MS`
- `JOB_WAIT_MS`
- `INLINE_QUEUE_MODE`
- `ADMIN_API_TOKEN`
- `ADMIN_API_ACTOR_ID`
- `USER_API_TOKENS`

Optional seed/bootstrap variables:

- `SEED_USER_ID`
- `SEED_USER_EMAIL`
- `SEED_USER_NAME`
- `SEED_USER_COUNTRY`
- `SEED_WALLET_CURRENCY`
- `SEED_PENDING_BALANCE`
- `SEED_AVAILABLE_BALANCE`
- `SEED_FROZEN_BALANCE`
- `SEED_PAID_OUT_BALANCE`
- `SEED_ADMIN_ACTOR_ID`

Optional sandbox verification variables:

- `PAYPAL_SANDBOX_INVOICE_RECIPIENT_EMAIL`
- `PAYPAL_SANDBOX_PAYOUT_RECEIVER`
- `PAYPAL_SANDBOX_INVOICE_AMOUNT`
- `PAYPAL_SANDBOX_PAYOUT_AMOUNT`
- `PAYPAL_SANDBOX_CURRENCY`

## Local Setup

1. Change into the backend package.
2. Install dependencies.
3. Copy the environment file.
4. Start a local Redis server.
5. Initialize the SQLite schema.
6. Seed a demo user and wallet.
7. Start the API and worker in separate processes.

```bash
cd api
npm install
cp .env.example .env
redis-server --save "" --appendonly no
npm run db:migrate
npm run db:seed
npm run dev
npm run dev:worker
```

The API listens on `PORT` and stores SQLite data at `SQLITE_DATABASE_PATH`.

`npm run db:seed` creates or updates the demo account configured by the `SEED_*` variables. By default it provisions:

- user id `demo-user`
- admin actor id `admin-demo`
- wallet currency `USD`
- available balance `250000` cents

## Authentication

User and admin auth are environment-driven so the API can stay simple in local development while still enforcing scope in production-like environments.

- `USER_API_TOKENS` accepts comma-separated `userId:token` pairs.
- `ADMIN_API_TOKEN` enables bearer auth for `/api/admin/*`.
- `ADMIN_API_ACTOR_ID` sets the default admin actor recorded in audit logs.

Example:

```bash
export USER_API_TOKENS='demo-user:user-demo-token,secondary-user:user-secondary-token'
export ADMIN_API_TOKEN='admin-secret-token'
export ADMIN_API_ACTOR_ID='admin-api'
```

Request examples:

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H 'Authorization: Bearer user-demo-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "demo-user",
    "recipientEmail": "buyer@example.com",
    "currency": "USD",
    "description": "Consulting retainer",
    "items": [{ "name": "Consulting", "quantity": 1, "unitAmount": 125 }]
  }'

curl http://localhost:3000/api/admin/payouts \
  -H 'Authorization: Bearer admin-secret-token'
```

## API Behavior

### Create invoice

`POST /api/invoices`

The API validates amount, currency, recipient email, and items; creates the PayPal invoice; sends it immediately; persists the PayPal invoice id and recipient payment URL; and returns:

- internal `invoice_id`
- PayPal invoice id
- current status
- real PayPal payment link
- summary object

### Request payout

`POST /api/payouts`

Requires an `Idempotency-Key` header. The service:

- validates the request
- checks internal `available_balance`
- runs risk checks
- reserves funds in the internal ledger
- either returns `pending_approval`, `denied`, or queues immediate processing

The response includes:

- internal `payout_id`
- current status
- tracking info
- risk decision

Admin approval and rejection routes attribute actions through the authenticated admin actor by default. You can still override that with `x-admin-actor-id` when you need explicit delegation recorded in audit logs.

### Release paid invoice funds

`POST /api/admin/invoices/:id/release`

Requires:

- admin bearer token when `ADMIN_API_TOKEN` is configured
- `Idempotency-Key` header

The route releases paid funds from `pending_balance` to `available_balance` through the internal ledger. The amount is optional; omitting it releases the remaining paid balance for that invoice.

### Admin review queues

The admin list endpoints expose operational queues without trusting PayPal state as the ledger source of truth:

- `GET /api/admin/payouts`
- `GET /api/admin/risk-flags`
- `GET /api/admin/webhooks`
- `GET /api/admin/queues`
- `GET /api/admin/dead-letters`

Useful filters:

- `status`
- `riskDecision`
- `severity`
- `eventType`
- `limit`

`GET /api/admin/queues` returns BullMQ job counts per operational queue plus the current Redis connection status. `GET /api/admin/dead-letters` returns recently failed terminal jobs from the dead-letter queue so operators can inspect retry exhaustion without shelling into Redis directly.

### Webhooks

`POST /webhooks/paypal`

The webhook flow:

- keeps the raw request body for signature verification
- verifies the PayPal signature
- persists the webhook receipt
- enqueues asynchronous processing
- updates invoices, ledger balances, and audit logs

Handled invoice events:

- `INVOICING.INVOICE.PAID`
- `INVOICING.INVOICE.CANCELLED`
- `INVOICING.INVOICE.REFUNDED`
- `INVOICING.INVOICE.UPDATED`

## PayPal Sandbox Instructions

1. Create a PayPal developer app and collect sandbox client credentials.
2. Set `PAYPAL_ENVIRONMENT=sandbox`.
3. Create a webhook in the PayPal developer dashboard and copy its id into `PAYPAL_WEBHOOK_ID`.
4. Subscribe the webhook to:
   - `INVOICING.INVOICE.PAID`
   - `INVOICING.INVOICE.CANCELLED`
   - `INVOICING.INVOICE.REFUNDED`
   - `INVOICING.INVOICE.UPDATED`
5. Point the webhook URL to `/webhooks/paypal`.
6. Use sandbox buyer and recipient accounts to validate both invoice payment and payout execution.

For a direct provider smoke test, set the sandbox helper variables in `api/.env` and run:

```bash
cd api
npm run verify:paypal:sandbox
```

The script will:

- ensure the SQLite schema exists
- bootstrap the configured demo user and wallet
- create and send a real PayPal sandbox invoice
- print the real PayPal invoice link
- request a payout and, if the risk engine marks it `PENDING_APPROVAL`, approve and process it
- print payout batch/item tracking ids or the latest provider state

Recommended `.env` additions for that run:

```bash
PAYPAL_SANDBOX_INVOICE_RECIPIENT_EMAIL=sandbox-buyer@example.com
PAYPAL_SANDBOX_PAYOUT_RECEIVER=sandbox-recipient@example.com
PAYPAL_SANDBOX_INVOICE_AMOUNT=12.50
PAYPAL_SANDBOX_PAYOUT_AMOUNT=5.00
PAYPAL_SANDBOX_CURRENCY=USD
```

Expected outcomes:

- invoice creation returns a real `invoice_link`
- payout creation returns `payout_id`, `status`, and tracking info
- webhook delivery moves paid invoices into internal pending balance
- `POST /api/admin/invoices/:id/release` moves cleared funds into available balance

Implementation notes for the current PayPal behavior live in [docs/codex/references/paypal-integration.md](/workspaces/Transferly/docs/codex/references/paypal-integration.md:1).

## Verification

Recommended checks:

```bash
cd api
npm run db:migrate
npm run db:seed
npm run lint
npm test
```

`INLINE_QUEUE_MODE=true` is available for local verification and tests when you want controller flows to execute synchronously without a live worker loop. Keep it disabled for normal asynchronous operation.

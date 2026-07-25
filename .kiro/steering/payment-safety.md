---
inclusion: always
---

# Payment, Ledger & Security Rules

These rules apply at all times, not only during explicit security reviews.

## Ledger is the Source of Truth

The internal ledger (`ledger_entries` table + `wallets` table) is the authoritative source of all balances. **Never trust PayPal status alone** to determine wallet state.

Balance tiers:
- `available_balance` — Ready for payout
- `pending_balance` — Awaiting release (from paid invoices)
- `frozen_balance` — Reserved for in-flight payouts
- `paid_out_balance` — Cumulative paid out (append-only)

## Balance Mutations — Mandatory Pattern

Never modify wallet balance columns directly. Always go through `ledgerService`:

```js
// WRONG
wallet.available_balance -= amount;

// RIGHT
await ledgerService.createLedgerEntry({
  walletId,
  type: 'DEBIT',
  amount,
  reason: 'payout_request',
  relatedId: payoutId,
});
// ledgerService updates balance AND creates the audit record atomically
```

## Database Transactions

Wrap ALL balance-changing operations in a SQLite transaction. If any step fails, roll back the entire operation:

- wallet balance update
- ledger entry creation
- audit log write

Never partially commit financial state.

## Idempotency

- All payout submissions MUST use a deterministic `Idempotency-Key` header (enforced by `requireIdempotencyKey` middleware)
- Webhook ingestion MUST deduplicate by event ID before processing
- PayPal API calls MUST use deterministic batch/item IDs derived from internal IDs

## Audit Logging

Record audit log entries (`auditLogService`) for every:
- Invoice creation
- Payout request
- Admin approval or rejection
- Webhook event processed
- Ledger mutation

## Webhook Security

- Verify PayPal webhook signatures using the **raw request body** (`providerWebhookSignatures.js`) before any processing
- Verify Telegram webhook secret header (`TELEGRAM_WEBHOOK_SECRET`) before processing bot updates
- Persist webhook receipts to DB **before** enqueuing async processing
- Return HTTP 200 to the provider promptly; do heavy work in the BullMQ job

## Authentication & Authorization

- All `/api/admin/*` routes require `ADMIN_API_TOKEN` bearer auth via `authenticateRequest` middleware
- All user routes require `USER_API_TOKENS` bearer auth scoped to `userId`
- Telegram Mini App `initData` must pass HMAC verification (`telegramMiniAppAuth.js`) before trusting session identity
- `x-admin-actor-id` header is only honored after admin auth middleware passes — never trust it alone

## PayPal Integration Safety

- Persist the PayPal invoice ID and payment URL before returning a success response to the caller
- Persist every externally meaningful state transition before acknowledging it as complete
- Handle `INVOICING.INVOICE.PAID`, `CANCELLED`, `REFUNDED`, `UPDATED` webhook events idempotently
- The `POST /api/admin/invoices/:id/release` route requires both admin auth AND an `Idempotency-Key`

## Risk Assessment

All payout requests go through `riskService` before funds are reserved. A `denied` decision must result in no ledger mutations. A `pending_approval` decision reserves funds in `frozen_balance` and waits for admin action.

## Secrets in Code — Hard Rules

- Never log `PAYPAL_CLIENT_SECRET`, bearer tokens, webhook headers, or raw event payloads
- Never hardcode credentials; always read from `process.env` via `api/config.js`
- `INLINE_QUEUE_MODE=true` is test-only — never set in production deployments

# Flashing Project Instructions

## Intent
- Build and maintain a production-grade backend API for PayPal invoicing and payouts.
- Keep the codebase modular, service-oriented, and operationally safe by default.

## Stack Constraints
- Runtime: Node.js
- Language: CommonJS JavaScript
- HTTP framework: Express
- Database: SQLite
- Queueing: Redis with BullMQ
- Validation: Zod

## Repository Workflow
- Start with the smallest reviewable diff that moves the backend forward.
- Match the module boundaries defined in `docs/codex/references/project-architecture.md`.
- Run backend package-manager commands from `api/`, which is now the authoritative npm package root.
- Keep transport logic in controllers/routes, business logic in services, persistence in repositories, and side effects in jobs/webhooks.
- Prefer additive changes over premature abstraction.
- Do not expose PayPal secrets, bearer tokens, webhook headers, or raw event payloads in logs.

## Docs-First Policy For This Repo
- Load `docs/codex/references/paypal-integration.md` before changing PayPal invoice, payout, OAuth, or webhook behavior.
- Load `docs/codex/references/project-architecture.md` before introducing new modules or cross-cutting infrastructure.
- Treat the official PayPal docs linked from those files as the source of truth for endpoints, event names, and webhook verification requirements.
- If local code and the documented PayPal behavior differ, state the mismatch explicitly before patching.

## Backend Conventions
- Use idempotency for payout submission and webhook ingestion.
- Persist every externally meaningful state transition in the database before acknowledging it as complete.
- Trust the internal ledger for balances, not PayPal resource status alone.
- Wrap balance-changing operations in database transactions.
- Record audit logs for invoice creation, payout requests, approval/rejection actions, webhook processing, and ledger mutations.
- Prefer enum-backed state machines over free-form status strings when data is persisted.

## Verification
- Use the fastest relevant checks first.
- For backend changes, prefer:
  - `npm run lint`
  - `npm run db:migrate`
  - `npm run test`
- If a check cannot run, state the exact missing prerequisite.

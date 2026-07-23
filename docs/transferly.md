# CODEX MASTER IMPLEMENTATION PROMPT  
## Transferly V2 — Complete Telegram-Native Marketplace and Service Architecture

Deeply review and rebuild the systems in the GitHub repository:

`vocalynz/Transferly`

Implement the complete Transferly V2 architecture described below across:

- `miniapp/`
- `api/`
- `bot/`
- database migrations
- background workers
- queues
- storage
- Telegram authentication
- TonConnect integration
- administrator controls
- automated tests
- deployment configuration
- production-readiness scripts

The objective is to build a highly polished, reliable, secure, scalable, mobile-first Telegram Mini App marketplace using an original clean-room architecture inspired only by the supplied high-level workflow.

Do not copy proprietary source code, branding, written content, visual assets, templates, layouts, or private implementation details from SlipCraft or any other external platform.

Do not describe the result as an exact source-code clone. Build an original Transferly implementation with equivalent legitimate workflow concepts.

---

# Core Safety and Product Boundaries

Do not implement functionality that:

- generates misleading proof of payment
- fabricates successful transactions
- impersonates banks, payment providers, or unrelated companies
- sends spoofed official-looking emails
- harvests login credentials
- captures passwords
- recreates third-party login pages for deceptive use
- stores credentials entered into awareness simulations
- hides sandbox or test status
- bypasses provider limits, security controls, or authorization

Replace unsafe concepts with:

- verified transaction records generated only from real Transferly ledger, invoice, payout, order, or provider data
- permanently labeled sandbox documents
- approved transactional notifications sent from verified Transferly domains
- Transferly-owned support pages
- security-awareness simulations that never collect or transmit credentials
- legitimate marketplace, points, wallet, order, and delivery functionality

All sandbox or demonstration records must permanently display:

- `SANDBOX / TEST`
- `TEST DATA ONLY`
- `NOT PROOF OF PAYMENT`

These markings must be embedded into the generated output and must not be removable by ordinary users.

---

# Existing Project Review

Before modifying code, inspect:

- root `package.json`
- `README.md`
- `AGENTS.md`
- `api/package.json`
- `miniapp/package.json`
- `bot/package.json`
- environment examples
- migrations
- database repositories
- services
- controllers
- schemas
- routes
- middleware
- provider adapters
- webhook processing
- workers
- queues
- Mini App routes
- Telegram context
- authentication flow
- TonConnect packages
- Playwright configuration
- deployment scripts
- production-readiness checks
- recent commits and partially completed changes

Record:

- current architecture
- existing working behavior
- incomplete work
- broken routes
- authentication problems
- duplicated code
- dead code
- failed tests
- missing environment variables
- migration risks
- deployment blockers

Do not begin with a destructive rewrite.

Create a safe migration plan before replacing existing modules.

---

# Backend Architecture Decision

The existing Transferly API uses Node.js and CommonJS.

Use the following decision order:

## Preferred Approach

Retain the existing Express/CommonJS backend and reorganize it using Laravel/Adonis-inspired modular conventions:

- routes
- middleware
- controllers
- validators or schemas
- policies
- services
- repositories
- presenters
- events
- listeners
- background jobs
- adapters
- webhooks
- migrations
- tests

This is the preferred approach because it reduces migration risk and preserves current working API contracts.

## Alternative Approach

Only migrate to modern AdonisJS when explicitly justified and approved after repository inspection.

A modern AdonisJS implementation should use its supported ESM and TypeScript conventions.

Do not force modern AdonisJS into CommonJS.

If AdonisJS is selected:

- create a parallel versioned backend
- preserve stable API contracts
- migrate endpoint by endpoint
- add compatibility adapters
- run both systems during transition where necessary
- remove the old system only after complete verification

Document the selected backend strategy before implementation.

---

# Implementation Principles

All changes must be:

- modular
- production-oriented
- secure by default
- transaction-safe
- idempotent
- observable
- testable
- mobile-first
- Telegram-native
- backward-compatible where required
- implemented in small, reviewable phases

Do not:

- weaken validation
- bypass authentication
- remove failing tests to obtain a passing build
- suppress meaningful errors
- directly mutate wallet balances
- trust frontend role claims
- expose secrets
- hardcode the owner in frontend code
- allow provider failures to corrupt internal ledger state
- perform a risky one-step rewrite

---

# 1. COMPLETE SYSTEM ARCHITECTURE

Build the complete system using the following logical architecture:

```text
┌─────────────────────────────────────────────────────┐
│                Telegram Application                 │
│                                                     │
│  Telegram Bot → Mini App Launcher → Mini App        │
│                                 → TonConnect         │
└─────────────────────────┬───────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────┐
│                Transferly Mini App                  │
│                                                     │
│ React + Vite + Tailwind + Telegram WebApp APIs      │
│                                                     │
│ Dashboard                                           │
│ Wallet and Points                                   │
│ Service Catalogue                                   │
│ Orders                                              │
│ Transaction Records                                 │
│ Notification Studio                                 │
│ Support Page Studio                                 │
│ Awareness Training Studio                           │
│ Marketplace                                         │
│ Support Tickets                                     │
│ Profile and Settings                                │
│ Admin Console                                       │
└─────────────────────────┬───────────────────────────┘
                          │ HTTPS JSON API
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Transferly API                    │
│                                                     │
│ Routes                                              │
│   ↓                                                 │
│ Middleware                                          │
│   ↓                                                 │
│ Controllers                                         │
│   ↓                                                 │
│ Application Services                                │
│   ↓                                                 │
│ Policies and Authorization                          │
│   ↓                                                 │
│ Repositories                                        │
│   ↓                                                 │
│ SQL Database                                        │
└──────────────┬───────────────────┬──────────────────┘
               │                   │
               ▼                   ▼
┌──────────────────────┐   ┌──────────────────────────┐
│ Redis + BullMQ       │   │ Private Object Storage   │
│                      │   │                          │
│ Order jobs           │   │ Generated records        │
│ Generation jobs      │   │ Support pages            │
│ Notification jobs    │   │ Approved media           │
│ Expiry jobs          │   │ Signed downloads         │
│ Reconciliation       │   │ Versioned templates      │
│ Dead-letter handling │   │ Retention management     │
└──────────┬───────────┘   └──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│               External Integrations                 │
│                                                     │
│ Telegram Bot API                                    │
│ Telegram WebApp APIs                                │
│ TON / TonConnect                                    │
│ Approved payment providers                          │
│ Approved email provider                             │
│ Error monitoring                                    │
│ Logging and metrics                                 │
└─────────────────────────────────────────────────────┘
```

Maintain clear trust boundaries between:

- Telegram user authentication
- Transferly application session
- TonConnect wallet ownership
- bot-to-API service authentication
- provider webhook authentication
- administrator authorization

These must not reuse the same credential or trust mechanism.

---

# 2. REPOSITORY AND MODULE STRUCTURE

Reorganize the repository into a clear modular structure.

When retaining Express/CommonJS, use:

```text
Transferly/
├── api/
│   ├── app.js
│   ├── config/
│   │   ├── appConfig.js
│   │   ├── authConfig.js
│   │   ├── corsConfig.js
│   │   ├── databaseConfig.js
│   │   ├── queueConfig.js
│   │   ├── storageConfig.js
│   │   └── serviceConfig.js
│   │
│   ├── start/
│   │   ├── kernel.js
│   │   ├── routes.js
│   │   ├── events.js
│   │   └── workers.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── workspaceRoutes.js
│   │   ├── walletRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── assetRoutes.js
│   │   ├── marketplaceRoutes.js
│   │   ├── supportRoutes.js
│   │   ├── walletLinkRoutes.js
│   │   ├── adminRoutes.js
│   │   └── healthRoutes.js
│   │
│   ├── middleware/
│   │   ├── authenticateTelegramSession.js
│   │   ├── requirePermission.js
│   │   ├── requireAdmin.js
│   │   ├── requireOwner.js
│   │   ├── ensureAccountActive.js
│   │   ├── validateIdempotency.js
│   │   ├── rateLimit.js
│   │   ├── requestContext.js
│   │   └── errorHandler.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── workspaceController.js
│   │   ├── walletController.js
│   │   ├── serviceController.js
│   │   ├── orderController.js
│   │   ├── assetController.js
│   │   ├── marketplaceController.js
│   │   ├── supportController.js
│   │   ├── walletLinkController.js
│   │   └── admin/
│   │       ├── adminDashboardController.js
│   │       ├── adminUserController.js
│   │       ├── adminWalletController.js
│   │       ├── adminLedgerController.js
│   │       ├── adminServiceController.js
│   │       ├── adminTemplateController.js
│   │       ├── adminOrderController.js
│   │       ├── adminTradeController.js
│   │       ├── adminDisputeController.js
│   │       └── adminSystemController.js
│   │
│   ├── schemas/
│   │   ├── authSchemas.js
│   │   ├── walletSchemas.js
│   │   ├── serviceSchemas.js
│   │   ├── orderSchemas.js
│   │   ├── marketplaceSchemas.js
│   │   ├── supportSchemas.js
│   │   └── adminSchemas.js
│   │
│   ├── policies/
│   │   ├── walletPolicy.js
│   │   ├── orderPolicy.js
│   │   ├── assetPolicy.js
│   │   ├── marketplacePolicy.js
│   │   ├── supportPolicy.js
│   │   └── adminPolicy.js
│   │
│   ├── services/
│   │   ├── telegramIdentityService.js
│   │   ├── sessionService.js
│   │   ├── workspaceService.js
│   │   ├── walletService.js
│   │   ├── pointLedgerService.js
│   │   ├── walletReservationService.js
│   │   ├── catalogueService.js
│   │   ├── pricingService.js
│   │   ├── orderService.js
│   │   ├── generationService.js
│   │   ├── assetStorageService.js
│   │   ├── notificationService.js
│   │   ├── marketplaceService.js
│   │   ├── escrowService.js
│   │   ├── disputeService.js
│   │   ├── supportTicketService.js
│   │   ├── walletLinkService.js
│   │   ├── auditLogService.js
│   │   └── reconciliationService.js
│   │
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── telegramAccountRepository.js
│   │   ├── profileRepository.js
│   │   ├── walletRepository.js
│   │   ├── ledgerRepository.js
│   │   ├── walletReservationRepository.js
│   │   ├── serviceRepository.js
│   │   ├── serviceTemplateRepository.js
│   │   ├── orderRepository.js
│   │   ├── assetRepository.js
│   │   ├── listingRepository.js
│   │   ├── tradeRepository.js
│   │   ├── disputeRepository.js
│   │   ├── supportTicketRepository.js
│   │   ├── notificationRepository.js
│   │   ├── idempotencyRepository.js
│   │   └── auditLogRepository.js
│   │
│   ├── generators/
│   │   ├── generatorContract.js
│   │   ├── generatorRegistry.js
│   │   ├── transactionRecordGenerator.js
│   │   ├── notificationTemplateGenerator.js
│   │   ├── supportPageGenerator.js
│   │   └── awarenessSimulationGenerator.js
│   │
│   ├── events/
│   │   ├── eventBus.js
│   │   ├── orderEvents.js
│   │   ├── walletEvents.js
│   │   ├── marketplaceEvents.js
│   │   └── notificationEvents.js
│   │
│   ├── listeners/
│   │   ├── dispatchOrderProcessing.js
│   │   ├── commitCompletedReservation.js
│   │   ├── releaseFailedReservation.js
│   │   ├── createActivityNotification.js
│   │   └── writeAuditEvent.js
│   │
│   ├── jobs/
│   │   ├── worker.js
│   │   ├── processOrderJob.js
│   │   ├── publishSupportPageJob.js
│   │   ├── sendNotificationJob.js
│   │   ├── expireReservationJob.js
│   │   ├── reconcileWalletJob.js
│   │   └── cleanupExpiredAssetJob.js
│   │
│   ├── adapters/
│   │   ├── queueAdapter.js
│   │   ├── storageAdapter.js
│   │   ├── emailAdapter.js
│   │   ├── telegramAdapter.js
│   │   ├── tonAdapter.js
│   │   └── providers/
│   │
│   ├── presenters/
│   │   ├── userPresenter.js
│   │   ├── workspacePresenter.js
│   │   ├── walletPresenter.js
│   │   ├── orderPresenter.js
│   │   ├── marketplacePresenter.js
│   │   └── errorPresenter.js
│   │
│   ├── webhooks/
│   │   ├── telegramWebhook.js
│   │   ├── providerWebhook.js
│   │   └── webhookVerifier.js
│   │
│   ├── db/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── transaction.js
│   │   └── connection.js
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── contract/
│       └── security/
│
├── miniapp/
│   ├── src/
│   │   ├── app/
│   │   ├── routes/
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── wallet/
│   │   │   ├── catalogue/
│   │   │   ├── orders/
│   │   │   ├── transaction-records/
│   │   │   ├── notifications/
│   │   │   ├── support-pages/
│   │   │   ├── awareness-training/
│   │   │   ├── marketplace/
│   │   │   ├── support/
│   │   │   └── admin/
│   │   ├── integrations/
│   │   │   ├── telegram/
│   │   │   └── tonconnect/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── state/
│   │   ├── styles/
│   │   └── lib/
│   │
│   └── tests/
│       └── e2e/
│
├── bot/
│   ├── commands/
│   ├── menus/
│   ├── middleware/
│   ├── handlers/
│   ├── services/
│   ├── scripts/
│   └── tests/
│
├── docs/
├── scripts/
└── package.json
```

Do not create empty folders or placeholder abstractions without real usage.

---

# 3. TELEGRAM-ONLY USER IDENTITY

Remove visible email/password authentication from the Telegram Mini App.

Do not show:

- login page
- signup page
- forgot-password page
- password-reset page
- email-verification page

Use Telegram as the passwordless identity provider.

The authentication flow must be:

```text
User opens Telegram bot
        ↓
User taps “Open Transferly”
        ↓
Telegram launches the Mini App
        ↓
Mini App waits for Telegram runtime
        ↓
Raw Telegram initData becomes available
        ↓
Frontend submits initData to the API
        ↓
API validates Telegram signature
        ↓
API validates auth_date and expiry
        ↓
API resolves or provisions the user
        ↓
Owner/admin role is reconciled securely
        ↓
Short-lived Transferly session is issued
        ↓
Authenticated workspace is returned
        ↓
Protected API requests begin
```

Implement:

```http
POST /api/auth/telegram
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/me
GET  /api/workspace
```

Authentication requirements:

- validate raw `initData` on the backend
- do not trust `initDataUnsafe` as proof of identity
- validate Telegram HMAC correctly
- exclude only `hash` from the data-check string
- sort parameters consistently
- use timing-safe comparison
- require valid `auth_date`
- reject excessively old data
- reject data too far in the future
- allow only a small documented clock-skew window
- never log raw `initData`
- never expose the bot token
- prevent replay where possible
- issue finite sessions
- reject malformed or expired sessions
- support bounded recovery
- prevent parallel authentication storms

Use explicit frontend states:

```text
detecting-runtime
waiting-for-init-data
authenticating
authenticated
refreshing-session
guest-preview
offline
failed
```

Guest Preview requirements:

- available only outside a valid Telegram launch
- read-only
- no wallet operations
- no order creation
- no point spending
- no marketplace trades
- no private downloads
- no administrator controls

A valid Telegram launch must not silently become Guest Mode.

Owner and administrator roles must be assigned only from backend environment configuration and verified Telegram user IDs:

```text
TRANSFERLY_OWNER_TELEGRAM_USER_IDS=
TRANSFERLY_ADMIN_TELEGRAM_USER_IDS=
```

Do not authorize through:

- username
- display name
- frontend flags
- query parameters
- local storage
- email text
- hardcoded frontend identifiers

---

# 4. DATABASE MODEL AND MIGRATIONS

Create safe, incremental database migrations.

Do not delete old tables until compatibility and data migration have been verified.

## Users

```text
users
- id
- display_name
- status
- role
- created_at
- updated_at
```

Statuses:

```text
active
suspended
restricted
deleted
```

Roles:

```text
user
support
admin
owner
```

## Telegram Accounts

```text
telegram_accounts
- id
- user_id
- telegram_user_id
- username
- first_name
- last_name
- chat_id
- language_code
- last_authenticated_at
- created_at
- updated_at
```

Constraints:

```text
UNIQUE telegram_accounts.telegram_user_id
UNIQUE telegram_accounts.user_id
```

Normalize Telegram user IDs consistently.

Use transaction-safe upserts.

## Profiles

```text
profiles
- id
- user_id
- display_name
- avatar_url
- country_code
- timezone
- preferences
- created_at
- updated_at
```

## Wallets

```text
wallets
- id
- user_id
- currency
- status
- created_at
- updated_at
```

## Ledger Entries

```text
ledger_entries
- id
- wallet_id
- direction
- amount
- entry_type
- status
- reference_type
- reference_id
- idempotency_key
- balance_after
- metadata
- created_at
```

Directions:

```text
credit
debit
```

Entry types:

```text
signup_bonus
points_purchase
vendor_trade_credit
order_debit
reservation_hold
reservation_release
refund
admin_adjustment
promotional_credit
reconciliation_adjustment
```

Statuses:

```text
pending
posted
reversed
failed
```

The ledger must remain the source of truth.

Do not rely on directly editable wallet balance fields.

## Wallet Reservations

```text
wallet_reservations
- id
- wallet_id
- order_id
- amount
- status
- expires_at
- committed_at
- released_at
- created_at
- updated_at
```

Statuses:

```text
active
committed
released
expired
```

## Services

```text
services
- id
- slug
- name
- category
- description
- point_price
- status
- generator_key
- input_schema
- output_type
- configuration
- created_at
- updated_at
```

## Service Templates

```text
service_templates
- id
- service_id
- name
- description
- input_schema
- renderer_config
- preview_asset
- status
- version
- created_at
- updated_at
```

## Orders

```text
orders
- id
- order_number
- user_id
- service_id
- template_id
- point_cost
- input_data
- status
- idempotency_key
- failure_code
- failure_message
- queued_at
- started_at
- completed_at
- failed_at
- created_at
- updated_at
```

## Generated Assets

```text
generated_assets
- id
- order_id
- user_id
- asset_type
- storage_key
- mime_type
- file_size
- checksum
- classification
- expires_at
- created_at
```

Classifications:

```text
private
sandbox
verified-record
training
support-page
```

## Marketplace Listings

```text
marketplace_listings
- id
- seller_user_id
- points_available
- unit_price
- currency
- payment_method
- minimum_points
- maximum_points
- status
- expires_at
- created_at
- updated_at
```

## Marketplace Trades

```text
marketplace_trades
- id
- listing_id
- buyer_user_id
- seller_user_id
- points
- monetary_amount
- status
- expires_at
- completed_at
- created_at
- updated_at
```

## Disputes

```text
disputes
- id
- trade_id
- opened_by_user_id
- reason
- details
- status
- resolution
- resolved_by_user_id
- resolved_at
- created_at
- updated_at
```

## Support Tickets

```text
support_tickets
- id
- user_id
- subject
- category
- status
- priority
- assigned_to_user_id
- created_at
- updated_at
```

## Notifications

```text
notifications
- id
- user_id
- type
- title
- message
- data
- read_at
- created_at
```

## Audit Logs

```text
audit_logs
- id
- actor_type
- actor_id
- action
- entity_type
- entity_id
- request_id
- metadata
- created_at
```

## Idempotency Records

```text
idempotency_records
- id
- user_id
- idempotency_key
- operation
- request_hash
- response_status
- response_payload
- expires_at
- created_at
```

Add:

- foreign keys
- indexes
- uniqueness constraints
- state validation
- amount validation
- timestamps
- migration rollback support
- data reconciliation scripts

---

# 5. SERVICE CATALOGUE SYSTEM

Build a manifest-driven service catalogue.

Each service must define:

- unique slug
- display name
- category
- description
- point cost
- availability
- input schema
- output type
- generator key
- permission requirements
- queue behavior
- retention policy
- sandbox/live state
- version
- feature flag

Service status values:

```text
draft
preview
sandbox
active
maintenance
disabled
```

Example service manifest:

```json
{
  "slug": "transaction-record",
  "name": "Transaction Record",
  "category": "documents",
  "description": "Generate a verified record from an existing Transferly transaction.",
  "pointPrice": 10,
  "generator": "transaction-record",
  "outputType": "pdf",
  "requiresAuthenticatedUser": true,
  "requiresSourceTransaction": true,
  "status": "active",
  "inputSchema": {
    "type": "object",
    "required": ["transactionId", "format"],
    "properties": {
      "transactionId": {
        "type": "string"
      },
      "format": {
        "type": "string",
        "enum": ["pdf", "image"]
      }
    }
  }
}
```

Implement APIs:

```http
GET /api/services
GET /api/services/:slug
GET /api/services/:slug/templates
```

The API must return only services available to the authenticated user.

Do not hardcode all service behavior inside one large frontend component.

Create reusable:

- service cards
- category filters
- search
- service detail pages
- schema-driven forms
- preflight summaries
- cost displays
- service availability indicators
- sandbox badges
- order history links

---

# 6. ORDER MODEL AND STATE MACHINE

All service executions must create an order.

Use the following primary order lifecycle:

```text
draft
  ↓
validating
  ↓
preflight
  ↓
points_reserved
  ↓
queued
  ↓
processing
  ↓
completed
```

Alternative states:

```text
validation_failed
insufficient_points
manual_review
failed
cancelled
expired
refunded
```

Requirements:

- transitions happen only through `OrderService`
- controllers must not mutate status directly
- transitions are validated
- each transition is audited
- duplicate submissions are prevented
- point reservation and order creation are transactional
- completed orders cannot be processed twice
- retry creates a controlled new attempt
- irreversible operations require explicit preflight
- cancellation rules depend on current status
- refund rules are explicit
- failure codes are structured
- raw internal errors are not exposed to users

Implement:

```http
POST /api/orders/preflight
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
POST /api/orders/:id/cancel
POST /api/orders/:id/retry
```

---

# 7. SEQUENCE THREE SERVICE EXECUTION PIPELINE

Implement the complete service-processing sequence.

## Step 1: Service Selection

The user selects a service from the catalogue.

The Mini App requests:

```http
GET /api/services/:slug
```

The response must contain:

- service information
- point price
- templates
- input schema
- availability
- warnings
- permissions
- output type
- sandbox/live classification

## Step 2: Dynamic Input Form

Generate the form from the service schema.

Validate:

- client-side for usability
- server-side as the authority

Never trust client validation alone.

## Step 3: Preflight

Request:

```http
POST /api/orders/preflight
```

Example:

```json
{
  "serviceSlug": "transaction-record",
  "templateId": "tpl_standard",
  "input": {
    "transactionId": "txn_123",
    "format": "pdf"
  }
}
```

Response:

```json
{
  "ready": true,
  "pointCost": 10,
  "availablePoints": 100,
  "warnings": [],
  "requirements": [],
  "idempotencyKey": "order-preflight-generated-key"
}
```

Preflight must check:

- authenticated Telegram user
- account status
- permissions
- service availability
- template availability
- valid input
- source-record ownership
- point balance
- queue readiness
- storage readiness
- provider readiness where relevant
- feature flags
- request limits

## Step 4: Order Submission

Request:

```http
POST /api/orders
Idempotency-Key: order:UUID
```

The API must execute one database transaction:

```text
Validate request
      ↓
Resolve authenticated user
      ↓
Lock or serialize wallet operation
      ↓
Confirm available points
      ↓
Create order
      ↓
Create wallet reservation
      ↓
Create audit event
      ↓
Commit database transaction
      ↓
Dispatch background job
```

If queue dispatch fails after the database commit:

- keep the order recoverable
- mark queue state clearly
- retry dispatch safely
- do not create another reservation

## Step 5: Background Job

Worker payload:

```json
{
  "orderId": "ord_123",
  "attempt": 1,
  "correlationId": "req_123"
}
```

The worker must:

```text
Load order
      ↓
Verify current order state
      ↓
Acquire processing lock
      ↓
Mark processing
      ↓
Load generator
      ↓
Validate source data again
      ↓
Generate approved output
      ↓
Store output privately
      ↓
Create generated asset
      ↓
Commit point reservation
      ↓
Mark order completed
      ↓
Create notification
      ↓
Create audit event
```

## Failure Flow

```text
Generation fails
      ↓
Classify failure
      ↓
Mark order failed
      ↓
Release point reservation
      ↓
Write audit event
      ↓
Send safe user notification
      ↓
Place permanently failed jobs in dead-letter queue
```

## Recovery

Support:

- bounded retries
- exponential backoff with jitter
- dead-letter queue
- administrator replay
- idempotent processing
- processing locks
- stale-job detection
- job correlation IDs
- order attempt history

---

# 8. GENERATOR CONTRACT AND REGISTRY

Create a shared generator contract.

Example:

```js
class ServiceGenerator {
  async validate(input, context) {
    throw new Error('validate() must be implemented');
  }

  async preflight(context) {
    throw new Error('preflight() must be implemented');
  }

  async generate(context) {
    throw new Error('generate() must be implemented');
  }

  async cleanup(context) {
    return undefined;
  }
}
```

Generator context:

```js
{
  orderId,
  userId,
  serviceId,
  templateId,
  input,
  correlationId,
  mode,
  sourceRecords,
  storage,
  logger
}
```

Modes:

```text
sandbox
production
training
```

Registry:

```js
const generatorRegistry = {
  'transaction-record': TransactionRecordGenerator,
  'notification-template': NotificationTemplateGenerator,
  'support-page': SupportPageGenerator,
  'awareness-simulation': AwarenessSimulationGenerator
};
```

Requirements:

- unknown generators fail safely
- generators cannot access unrelated users
- generators receive normalized input
- generators do not directly mutate wallets
- output metadata is validated
- asset checksums are stored
- sandbox classification is enforced
- generated assets are private by default
- cleanup occurs after partial failures
- generators support versioning
- generator-specific tests are required

---

# 9. SAFE SERVICE STUDIOS

## 9.1 Transaction Record Studio

Generate transaction records only from verified backend data.

Allowed source records:

- Transferly ledger entries
- Transferly orders
- Transferly invoices
- Transferly payouts
- verified provider events
- wallet activity

The user may select an existing record but may not freely claim:

- successful payment
- completed payout
- transferred amount
- provider confirmation
- account ownership

The backend must load authoritative data.

Production records should include:

- Transferly record ID
- actual status
- created timestamp
- amount and currency
- verified parties where applicable
- audit reference
- source classification

Sandbox records must permanently show:

```text
SANDBOX / TEST
TEST DATA ONLY
NOT PROOF OF PAYMENT
```

Do not permit removal of these labels.

## 9.2 Notification Studio

Allow users to send approved transactional notifications.

Features:

- approved templates
- verified sender identity
- recipient validation
- subject
- permitted variables
- preview
- point cost
- delivery status
- activity history

Restrictions:

- no arbitrary sender spoofing
- no pretending to be banks or unrelated payment providers
- no false account-security notices
- no fake payment-confirmation messages
- no arbitrary third-party logos
- no deceptive links
- no collection of credentials
- no hidden sender replacement

Send only through verified Transferly-controlled domains.

## 9.3 Support Page Studio

Allow users to create Transferly-hosted support or profile pages.

Features:

- title
- approved theme
- user-owned logo
- description
- verified contact methods
- Telegram contact button
- email contact
- optional external URL
- custom slug
- publish/unpublish
- expiry
- analytics
- moderation status

Requirements:

- ownership declaration
- safe-link validation
- no third-party impersonation
- no login fields
- no password fields
- no payment credential collection
- clear page ownership
- abuse-report mechanism

## 9.4 Awareness Training Studio

Allow clearly labeled security-awareness demonstrations only.

Requirements:

- permanent training banner
- dummy input fields
- no credential storage
- no credential transmission
- no password logging
- no third-party login-page replica
- no invisible collection endpoint
- no deceptive public publication
- expiring training links
- administrator audit trail
- clear educational purpose
- safe synthetic branding

On submit, display a training explanation rather than sending field values.

---

# 10. MARKETPLACE AND ESCROW SYSTEM

Build a legitimate point marketplace with reservations and disputes.

## Listings

Users can create listings for available Transferly points.

Listing fields:

```text
seller
points available
unit price
currency
payment method
minimum points
maximum points
status
expiry
```

Listing statuses:

```text
draft
active
paused
fulfilled
expired
cancelled
```

## Trade Lifecycle

```text
created
   ↓
seller_points_reserved
   ↓
awaiting_external_payment
   ↓
buyer_marked_paid
   ↓
seller_review
   ↓
points_released
   ↓
completed
```

Alternative states:

```text
expired
cancelled
disputed
refunded
manual_review
```

## Escrow Behavior

Use internal ledger reservations.

```text
Seller points reserved
        ↓
Buyer completes external payment
        ↓
Buyer marks payment
        ↓
Seller confirms
        ↓
Reservation committed from seller
        ↓
Buyer receives ledger credit
        ↓
Trade completed
```

Seller debit and buyer credit must occur atomically in one database transaction.

Requirements:

- users cannot trade with themselves
- available listing amount must be locked safely
- duplicate confirmation must not duplicate credits
- disputes freeze settlement
- expiry releases reservations
- administrator resolution is audited
- point transfers use ledger entries
- no direct wallet balance edits
- listing limits and risk controls
- rate limiting
- trade activity history
- user ownership checks
- idempotent actions

Implement:

```http
GET    /api/marketplace/listings
POST   /api/marketplace/listings
PATCH  /api/marketplace/listings/:id
DELETE /api/marketplace/listings/:id

POST   /api/marketplace/trades
GET    /api/marketplace/trades
GET    /api/marketplace/trades/:id
POST   /api/marketplace/trades/:id/mark-paid
POST   /api/marketplace/trades/:id/confirm
POST   /api/marketplace/trades/:id/cancel
POST   /api/marketplace/trades/:id/dispute
```

---

# 11. COMPLETE API CONTRACT

Implement stable versioned APIs where useful.

## Authentication and Workspace

```http
POST /api/auth/telegram
POST /api/auth/refresh
POST /api/auth/logout

GET /api/me
GET /api/workspace
GET /api/dashboard
```

## Wallet

```http
GET /api/wallet
GET /api/wallet/ledger
GET /api/wallet/reservations
GET /api/wallet/activity
```

## Services

```http
GET /api/services
GET /api/services/:slug
GET /api/services/:slug/templates
```

## Orders

```http
POST /api/orders/preflight
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
POST /api/orders/:id/cancel
POST /api/orders/:id/retry
```

## Assets

```http
GET  /api/orders/:id/assets
GET  /api/assets/:id
POST /api/assets/:id/download-url
```

## Marketplace

```http
GET    /api/marketplace/listings
POST   /api/marketplace/listings
PATCH  /api/marketplace/listings/:id
DELETE /api/marketplace/listings/:id

POST   /api/marketplace/trades
GET    /api/marketplace/trades
GET    /api/marketplace/trades/:id
POST   /api/marketplace/trades/:id/mark-paid
POST   /api/marketplace/trades/:id/confirm
POST   /api/marketplace/trades/:id/cancel
POST   /api/marketplace/trades/:id/dispute
```

## Support

```http
GET  /api/support-tickets
POST /api/support-tickets
GET  /api/support-tickets/:id
POST /api/support-tickets/:id/messages
```

## TonConnect Wallet Linking

```http
POST   /api/wallet-links/challenge
POST   /api/wallet-links/verify
GET    /api/wallet-links
DELETE /api/wallet-links/:id
```

## Notifications

```http
GET  /api/notifications
POST /api/notifications/:id/read
POST /api/notifications/read-all
```

## Admin

```http
GET /api/admin/dashboard

GET  /api/admin/users
GET  /api/admin/users/:id
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/activate
POST /api/admin/users/:id/restrict

GET  /api/admin/wallets
GET  /api/admin/wallets/:userId
POST /api/admin/wallets/:userId/adjust

GET /api/admin/ledger

GET   /api/admin/services
POST  /api/admin/services
PATCH /api/admin/services/:id

GET   /api/admin/templates
POST  /api/admin/templates
PATCH /api/admin/templates/:id

GET  /api/admin/orders
GET  /api/admin/orders/:id
POST /api/admin/orders/:id/retry
POST /api/admin/orders/:id/refund
POST /api/admin/orders/:id/manual-review

GET /api/admin/trades
GET /api/admin/disputes
GET /api/admin/disputes/:id
POST /api/admin/disputes/:id/resolve

GET  /api/admin/jobs
GET  /api/admin/dead-letters
POST /api/admin/dead-letters/:id/retry

GET /api/admin/support-tickets
POST /api/admin/support-tickets/:id/assign
POST /api/admin/support-tickets/:id/resolve

GET /api/admin/audit-logs
GET /api/admin/system-health
```

All responses should use a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "requestId": "req_123",
  "meta": {}
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "You do not have enough points for this service.",
    "recoverable": false
  },
  "requestId": "req_123"
}
```

Do not expose stack traces in production.

---

# 12. MINI APP ROUTE AND UI ARCHITECTURE

Use the existing React/Vite Mini App.

Refactor into feature modules.

Route structure:

```text
/miniapp
├── /home
├── /services
│   ├── /:service
│   └── /:service/order
├── /wallet
│   ├── /overview
│   ├── /activity
│   ├── /reservations
│   └── /top-up
├── /orders
│   └── /:orderId
├── /studio
│   ├── /transaction-records
│   ├── /notifications
│   ├── /support-pages
│   └── /awareness-training
├── /marketplace
│   ├── /listings
│   ├── /trades
│   └── /trades/:tradeId
├── /support
├── /notifications
├── /profile
├── /settings
└── /admin
```

Recommended mobile bottom navigation:

```text
Home
Services
Studio
Wallet
Settings
```

Marketplace can be accessed from Services or Wallet to avoid overcrowding.

## UI Requirements

The Mini App must support:

- Telegram compact mode
- expanded mode
- fullscreen mode
- Telegram iOS
- Telegram Android
- Telegram Desktop
- browser fallback
- safe-area insets
- mobile keyboard
- portrait orientation
- narrow mobile widths
- light theme
- dark theme
- Telegram theme changes

Use:

- one controlled scroll container
- persistent bottom navigation
- safe-area-aware padding
- responsive headers
- skeleton loading
- clear empty states
- deduplicated errors
- accessible touch targets
- focus-visible styles
- reduced-motion support
- semantic navigation
- route-level error boundaries
- suspense and lazy route loading
- clear sandbox indicators
- status badges
- state-aware action buttons
- confirmation sheets for irreversible operations

Do not place all functionality inside one oversized page component.

Create reusable components:

- `AppShell`
- `TelegramViewportProvider`
- `AuthenticatedWorkspaceGate`
- `GlobalRecoveryPanel`
- `BottomNavigation`
- `AdaptiveHeader`
- `ServiceCard`
- `ServiceSchemaForm`
- `OrderStatusTimeline`
- `WalletSummary`
- `LedgerActivityList`
- `PointCostBadge`
- `SandboxBadge`
- `EmptyState`
- `LoadingSkeleton`
- `ResponsiveBottomSheet`
- `AdminDiagnosticsPanel`

Provider or service errors must not automatically become global authentication errors.

---

# 13. TONCONNECT ARCHITECTURE

Keep TonConnect separate from Telegram identity.

The trust model must be:

```text
Telegram initData
    = verifies Telegram identity

Transferly session
    = authorizes application access

TonConnect proof
    = verifies control of a TON wallet

Transferly ledger
    = determines internal point balance
```

Inspect existing TonConnect packages before making changes.

If missing, add approved current packages deliberately.

Create:

```text
miniapp/src/integrations/tonconnect/
├── TonConnectProvider.jsx
├── useTonWallet.js
├── WalletConnectButton.jsx
├── tonConnectManifest.js
├── walletProof.js
├── walletErrors.js
└── walletNetwork.js
```

Implement:

- connection
- disconnection
- connected-wallet display
- wallet network display
- challenge generation
- proof-of-ownership verification
- replay-safe challenge expiry
- backend wallet linking
- duplicate-link prevention
- multiple-wallet policy
- error handling
- loading state
- Telegram-safe modal behavior

Backend flow:

```text
Authenticated user requests challenge
        ↓
API creates short-lived challenge
        ↓
TonConnect wallet signs proof
        ↓
Frontend submits proof
        ↓
API verifies proof
        ↓
Wallet linked to authenticated user
```

Do not:

- trust an address sent without proof
- use wallet ownership as Telegram identity
- make TonConnect mandatory for unrelated features
- expose private keys
- request seed phrases
- store wallet secrets

---

# 14. ADMIN ARCHITECTURE

Build a backend-authorized administrator console.

Modules:

```text
Admin Console
├── Overview
├── Users
├── Telegram Accounts
├── Wallets
├── Ledger
├── Reservations
├── Services
├── Templates
├── Orders
├── Generated Assets
├── Marketplace Listings
├── Trades
├── Disputes
├── Support Tickets
├── Notifications
├── Jobs
├── Dead Letters
├── Audit Logs
├── System Health
├── Provider Health
└── Platform Settings
```

## Admin Authorization

Roles are determined by backend session claims derived from verified server-side identity.

Every admin route must enforce authorization through middleware and policy checks.

Do not rely on:

- hidden frontend links
- frontend `isAdmin` state
- query parameters
- local storage
- usernames

## Point Adjustments

Admin point changes must follow:

```text
Admin submits adjustment
        ↓
Permission checked
        ↓
Reason required
        ↓
Amount validated
        ↓
Database transaction begins
        ↓
Ledger entry created
        ↓
Audit record created
        ↓
Transaction committed
        ↓
Updated wallet returned
```

Never directly update a wallet balance.

## Admin Safety Controls

Require:

- reason for sensitive actions
- confirmation for destructive operations
- request IDs
- actor IDs
- audit logs
- rate limiting
- user and entity ownership checks
- optional second confirmation for large adjustments
- environment restrictions for production
- secret redaction
- immutable historical records

## Admin Diagnostics

Display safe diagnostics only:

- frontend version
- API version
- deployment environment
- sanitized API origin
- Telegram runtime state
- token presence, not value
- API health
- database health
- Redis health
- queue health
- provider health
- last request ID
- last deployment commit
- worker status

Never show:

- JWT values
- bot tokens
- raw Telegram `initData`
- database credentials
- provider secrets
- webhook secrets
- HMAC secrets

---

# 15. PRODUCTION CONTROLS, RELIABILITY, TESTING, AND RELEASE

## Authentication Security

Implement:

- Telegram `initData` signature verification
- bounded `auth_date` validity
- timing-safe comparison
- replay protections
- short-lived sessions
- secure session refresh
- role reconciliation
- duplicate-account protection
- unique Telegram identity constraints
- session invalidation
- bounded authentication retries
- protected owner/admin mapping

## Authorization

Verify:

- all private routes require authentication
- all user resources enforce ownership
- all admin routes enforce role authorization
- frontend user IDs cannot override authenticated identity
- object IDs cannot access another user’s data
- generated assets are owner-scoped
- trade actions enforce buyer/seller roles
- wallet operations use the authenticated user
- service policies are enforced backend-side

## Ledger and Financial Safety

Implement:

- append-only ledger
- wallet reservations
- transaction boundaries
- idempotency
- reconciliation
- negative-balance prevention
- amount validation
- duplicate credit prevention
- atomic marketplace settlement
- audited administrator adjustments
- no provider status directly mutating internal balances

## Queue Reliability

Implement:

- bounded retries
- exponential backoff with jitter
- processing locks
- dead-letter queue
- job attempt tracking
- stale-job recovery
- graceful shutdown
- worker readiness
- queue health
- idempotent jobs
- safe administrator replay

## Storage Security

Implement:

- private storage by default
- expiring signed download URLs
- access checks
- file-size validation
- MIME validation
- checksums
- retention policies
- asset expiry
- deletion jobs
- sandbox classification
- no public predictable storage paths

## API Reliability

Implement:

- request timeouts
- cancellation
- request IDs
- operation IDs
- structured errors
- retry only for safe/idempotent requests
- `Retry-After` support
- rate-limit classification
- exponential backoff
- API base URL validation
- CORS validation
- offline detection
- online recovery
- deduplicated GET requests where useful
- no infinite retry loops

Error codes should include:

```text
API_NOT_CONFIGURED
API_UNREACHABLE
REQUEST_TIMEOUT
CORS_BLOCKED
AUTH_INIT_DATA_MISSING
AUTH_SIGNATURE_INVALID
AUTH_DATA_EXPIRED
AUTH_REPLAY_REJECTED
SESSION_MISSING
SESSION_INVALID
SESSION_EXPIRED
FORBIDDEN
ACCOUNT_SUSPENDED
SERVICE_UNAVAILABLE
TEMPLATE_UNAVAILABLE
INVALID_INPUT
INSUFFICIENT_POINTS
ORDER_CONFLICT
RATE_LIMITED
QUEUE_UNAVAILABLE
STORAGE_UNAVAILABLE
ASSET_NOT_FOUND
PROVIDER_UNAVAILABLE
```

## Error-State Hierarchy

Use this priority:

```text
1. Telegram runtime detection
2. Authentication
3. Global API health
4. Workspace bootstrap
5. Service availability
6. Route-specific data
```

Do not display multiple error cards for one root problem.

Create one central recovery panel that:

- deduplicates errors
- shows one root cause
- includes retry state
- disables duplicate retries
- clears automatically after recovery
- displays request ID
- shows safe diagnostics for administrators
- never exposes stack traces

## Observability

Add:

- Pino structured logs
- request IDs
- operation IDs
- user ID where safe
- order ID
- trade ID
- job ID
- provider key
- latency metrics
- queue metrics
- authentication failure metrics
- API failure metrics
- database health
- Redis health
- worker health
- error monitoring
- deployment version

Redact:

- tokens
- passwords
- raw `initData`
- bot tokens
- database URLs
- private keys
- provider secrets
- webhook secrets
- HMAC secrets
- authorization headers

## Health Endpoints

Implement separate:

```http
GET /health/live
GET /health/ready
GET /health/client
GET /health/dependencies
```

Liveness should show that the process is running.

Readiness should validate required dependencies.

Provider failures should not automatically mark the whole API as unavailable unless the failed provider is required for the requested operation.

## Environment Validation

Validate required production variables:

```text
NODE_ENV
PORT
APP_BASE_URL
FRONTEND_URL
TELEGRAM_MINI_APP_URL
TELEGRAM_BOT_TOKEN
JWT_SECRET
TRANSFERLY_OWNER_TELEGRAM_USER_IDS
TRANSFERLY_ADMIN_TELEGRAM_USER_IDS
DATABASE_URL or SQLITE_DATABASE_PATH
REDIS_URL
STORAGE configuration
CORS_ALLOWED_ORIGINS
BOT_API_SHARED_SECRET
```

Validate provider-specific variables only when the provider is enabled.

Fail production startup or release verification when critical configuration is missing or unsafe.

Never print secret values.

## Telegram Bot

Keep the bot simple and reliable.

Commands:

```text
/start
/help
/support
/status
/terms
/privacy
```

Provide:

- one main Mini App launch button
- clear onboarding
- lightweight service status
- support link
- terms and privacy links

Do not recreate the entire marketplace inside the bot.

Verify:

- correct production Mini App URL
- webhook/polling exclusivity
- callback acknowledgements
- duplicate-update handling
- structured logs
- API authorization
- graceful shutdown
- startup validation
- no raw backend errors shown to users

## Bot-to-API Authentication

Use a dedicated server-side trust mechanism such as timestamped HMAC requests where appropriate.

Include:

- timestamp
- HTTP method
- normalized path and query
- deterministic request body
- signature
- approved API origins
- bounded timestamp freshness
- replay rejection
- timing-safe comparison
- key rotation plan

Do not expose this secret to the Mini App.

## Webhooks

Verify:

- provider-specific signatures
- Telegram webhook secret
- raw-body requirements
- timestamp freshness
- duplicate event IDs
- idempotent event processing
- replay prevention
- fast acknowledgement
- background processing
- retry handling
- dead-letter handling
- audit trail

## Automated Tests

Add unit tests for:

- Telegram data parsing
- Telegram HMAC verification
- invalid signatures
- expired auth data
- future auth data
- session token creation
- session expiration
- role mapping
- owner reconciliation
- ledger calculations
- wallet reservations
- order state transitions
- generator registry
- marketplace settlement
- administrator adjustment
- TonConnect proof validation
- API error classification

Add integration tests for:

- successful Telegram authentication
- delayed Telegram runtime
- delayed `initData`
- duplicate login prevention
- `/api/me`
- workspace bootstrap
- guest read-only behavior
- owner/admin authorization
- normal-user restrictions
- point reservation
- order completion
- failed order point release
- idempotency
- insufficient points
- generated asset ownership
- marketplace trade settlement
- dispute handling
- wallet linking
- CORS
- rate limiting
- webhook verification
- queue retry
- dead-letter recovery

Add Playwright tests for:

- 320px width
- 360px width
- 375px width
- 390px width
- 430px width
- tablet width
- Telegram compact mode
- expanded mode
- fullscreen mode
- safe areas
- light theme
- dark theme
- delayed Telegram initialization
- successful owner authentication
- successful normal-user authentication
- no Guest Mode in valid Telegram launch
- read-only Guest Preview outside Telegram
- dashboard
- service catalogue
- schema-driven form
- preflight
- order submission
- order timeline
- wallet activity
- marketplace flows
- TonConnect UI
- support tickets
- admin authorization
- persistent bottom navigation
- long-page scrolling
- keyboard opening
- route navigation
- error deduplication
- network outage
- recovery after outage
- console errors
- failed network requests

Use Playwright traces, screenshots, network logs, and console logs for failed scenarios.

## Migration Sequence

Implement in this order:

1. Establish baseline and document current behavior.
2. Create architecture decision record.
3. Add new database tables and migrations.
4. Add compatibility repositories.
5. Stabilize Telegram authentication.
6. Implement owner/admin role reconciliation.
7. Implement workspace bootstrap.
8. Implement wallet and immutable ledger.
9. Implement wallet reservations.
10. Implement service catalogue.
11. Implement order state machine.
12. Implement background generation pipeline.
13. Implement safe studios.
14. Implement generated asset storage.
15. Implement marketplace listings.
16. Implement trades and escrow settlement.
17. Implement disputes.
18. Implement TonConnect wallet linking.
19. Implement administrator console.
20. Simplify and stabilize the bot.
21. Add observability and health checks.
22. Add automated tests.
23. Run live Playwright validation.
24. Remove verified dead code.
25. Run complete production verification.
26. Deploy behind feature flags.
27. Gradually enable production modules.

Do not remove old behavior until its replacement passes regression tests.

## Verification Commands

Run all applicable commands, including:

```bash
npm run install:all
npm run lint
npm run test
npm run build
npm run verify
npm run check:production
npm run verify:staging
npm run check:miniapp:bundle
npm run scan:secrets
npm run verify:release
npm run miniapp:e2e
npm run api:migrate
```

Also run:

- API unit tests
- API integration tests
- bot tests
- provider smoke tests
- authentication tests
- ledger reconciliation tests
- marketplace settlement tests
- TonConnect tests
- Playwright headed tests where needed
- production environment validation
- dependency security audit where configured

Report each check as:

- passed
- failed
- skipped
- blocked

Do not claim production readiness while critical checks fail or remain untested.

---

# FINAL IMPLEMENTATION REPORT

After completing the implementation, provide a structured report containing:

1. Executive summary.
2. Architecture decision.
3. Existing issues discovered.
4. Root causes.
5. Features implemented.
6. Files created.
7. Files updated.
8. Files removed or consolidated.
9. Database migrations.
10. Telegram authentication changes.
11. Owner/admin authorization changes.
12. Workspace bootstrap changes.
13. Wallet and ledger implementation.
14. Reservation implementation.
15. Service catalogue implementation.
16. Order state-machine implementation.
17. Queue and job implementation.
18. Generator implementations.
19. Safe studio implementations.
20. Asset-storage implementation.
21. Marketplace implementation.
22. Escrow and dispute implementation.
23. TonConnect implementation.
24. Admin console implementation.
25. Bot changes.
26. API route changes.
27. Reliability improvements.
28. Security improvements.
29. Observability improvements.
30. Tests added.
31. Playwright scenarios run.
32. Commands run.
33. Passed checks.
34. Failed checks.
35. Skipped checks.
36. Environment-blocked checks.
37. Remaining risks.
38. Recommended next implementation phase.

Do not describe the project as complete or production-ready unless:

- Telegram authentication works reliably
- the verified owner receives the correct role
- normal users cannot access admin resources
- Guest Preview is read-only
- wallet balances reconcile from ledger entries
- order processing is idempotent
- failed orders release reservations
- generated assets enforce ownership
- sandbox records are permanently labeled
- marketplace settlement is atomic
- TonConnect proof verification works
- the bot securely launches the Mini App
- Playwright tests pass
- release verification passes
- no critical security or configuration issues remain

The completed system should feel like a premium, advanced, polished, Telegram-native digital-service marketplace while remaining original, secure, legitimate, maintainable, auditable, and production-ready.

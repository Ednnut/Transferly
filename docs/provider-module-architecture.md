# Provider Module Architecture

Transferly providers are discovered from `api/providers/<provider>/index.js`. A provider module owns its adapter binding, fixtures, readiness contract, provider-specific services, jobs, webhook handling, schemas, and tests. Shared HTTP routes, dashboard services, queue infrastructure, logging, error handling, and Mini App workspace primitives remain platform-owned.

## Implementation plan

1. Consolidate backend provider discovery and retain the current route contracts.
2. Move remaining PayPal-only workspace service behavior behind the shared module interface.
3. Make Mini App manifests consume registry metadata instead of maintaining parallel provider lists.
4. Extract reusable dashboard data hooks, loading/error states, lane navigation, and provider page primitives.
5. Add provider lifecycle, webhook, job, route, UI, and rollout-gate coverage before enabling setup-backed providers.

Current audit: API adapters and modules are reusable, but the old static adapter array, a dormant runtime registry scaffold, PayPal-only services, and Mini App manifest seeds are coupled implementations. The discovery-backed API registry addresses the first two seams; the remaining items require provider-by-provider migration with compatibility tests.

## Module contract

Each module must expose a directory-matching lowercase `key`, an `adapter`, `getContract()`, and `getReadiness()`. The adapter implements the common payment-provider contract used by `paymentProviderRegistry` and `/api/providers/:provider/*` routes.

## Rollout

`PAYMENT_PROVIDER_FEATURE_FLAGS` is a comma-separated allowlist. Leave it empty to enable all installed modules; set it to provider keys such as `paypal,stripe` for staged rollout. Disabled providers are omitted from discovery-backed API results and return the same safe not-found response as unknown providers.

## Adding a provider

1. Create `api/providers/<key>/index.js` using `createProviderWorkspaceModule`.
2. Add its adapter, schemas, jobs, webhooks, fixtures, and tests in the same module.
3. Verify its adapter contract and provider registry discovery test.
4. Add its Mini App manifest and shared workspace configuration; do not copy provider page scaffolding.
5. Enable it only through an explicit rollout flag after environment and webhook verification.

The API keeps `/api/providers/:provider/*` stable. Provider modules must not log credentials, raw webhook bodies, or bearer tokens.

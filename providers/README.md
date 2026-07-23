# Providers (modular architecture)

This folder documents the provider-first architecture for Transferly.

Goals:
- Each provider is a self-contained module (api + UI + jobs + webhooks + tests)
- Shared abstractions (BaseProvider, ProviderRegistry) live under api/providers and miniapp/src/providers
- Incremental migration: existing provider code remains; new modules register with the registry

Structure example:

providers/
├── paypal/           # api/providers/paypal + miniapp provider UI components
├── stripe/           # future provider
├── wise/             # future provider
└── shared/           # shared docs and patterns

Implementation notes:
- Providers implement the BaseProvider interface in api/providers/base-provider.js
- ProviderRegistry (api/providers/registry.js) discovers provider modules named *provider.js
- Frontend ProviderRegistryProvider wraps the app and enables provider UI registration

Next steps:
- Migrate existing provider-specific code (api/controllers, services) into provider modules incrementally
- Add ProviderClient implementations with retries, timeouts, and idempotency
- Add provider UI pages under miniapp/src/providers/<provider>

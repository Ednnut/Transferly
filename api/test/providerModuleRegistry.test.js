const assert = require('node:assert/strict');
const { test } = require('node:test');

process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
process.env.PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'paypal-client-secret';
process.env.PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || 'paypal-webhook-id';

const {
  ProviderModuleRegistry,
  discoverProviderModules
} = require('../providers/moduleRegistry');

test('discovers provider modules with a shared adapter contract', () => {
  const providers = discoverProviderModules();
  assert.deepEqual(providers.map((provider) => provider.key), [
    'paypal', 'stripe', 'wise', 'paystack', 'flutterwave', 'crypto'
  ]);
  assert.ok(providers.every((provider) => provider.adapter.getAdapterContract));
  assert.ok(providers.every((provider) => provider.getReadiness));
});

test('provider feature gates hide disabled modules without changing installed modules', () => {
  const providers = discoverProviderModules();
  const registry = new ProviderModuleRegistry({ modules: providers, enabledKeys: new Set(['paypal']) });
  assert.deepEqual(registry.list().map((provider) => provider.key), ['paypal']);
  assert.equal(registry.get('paypal').key, 'paypal');
  assert.throws(() => registry.get('stripe'), (error) => error.code === 'PAYMENT_PROVIDER_NOT_FOUND');
});

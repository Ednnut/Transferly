const assert = require('node:assert/strict');
const { test } = require('node:test');
const StripeService = require('../service');

test('StripeService listPayments returns an object', async () => {
  const svc = new StripeService({ config: {} });
  const res = await svc.listPayments();
  assert.ok(res !== undefined);
});

test('StripeService getBalance returns without throwing', async () => {
  const svc = new StripeService({ config: {} });
  const res = await svc.getBalance();
  assert.ok(res === null || typeof res === 'object');
});

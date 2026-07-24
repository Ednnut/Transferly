const assert = require('node:assert/strict');
const { test } = require('node:test');
const CryptoCommerceService = require('../service');

test('CryptoCommerceService listCharges returns an object', async () => {
  const svc = new CryptoCommerceService({ config: {} });
  const res = await svc.listCharges();
  assert.ok(res !== undefined);
});

test('CryptoCommerceService getCharge returns without throwing', async () => {
  const svc = new CryptoCommerceService({ config: {} });
  const res = await svc.getCharge('test-charge-id');
  assert.ok(res === null || typeof res === 'object');
});

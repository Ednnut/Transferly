const assert = require('node:assert/strict');
const { test } = require('node:test');
const FlutterwaveService = require('../service');

test('FlutterwaveService listTransactions returns an object', async () => {
  const svc = new FlutterwaveService({ config: {} });
  const res = await svc.listTransactions();
  assert.ok(res !== undefined);
});

test('FlutterwaveService getBalance returns without throwing', async () => {
  const svc = new FlutterwaveService({ config: {} });
  const res = await svc.getBalance();
  assert.ok(res === null || typeof res === 'object');
});

const assert = require('node:assert/strict');
const { test } = require('node:test');
const PaystackService = require('../service');

test('PaystackService listTransactions returns an object', async () => {
  const svc = new PaystackService({ config: {} });
  const res = await svc.listTransactions();
  assert.ok(res !== undefined);
});

test('PaystackService getBalance returns without throwing', async () => {
  const svc = new PaystackService({ config: {} });
  const res = await svc.getBalance();
  assert.ok(res === null || typeof res === 'object');
});

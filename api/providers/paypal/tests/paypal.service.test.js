const assert = require('node:assert/strict');
const { test } = require('node:test');
const PayPalService = require('../service');

test('PayPalService listTransactions returns an object', async () => {
  const svc = new PayPalService({ config: {} });
  const res = await svc.listTransactions();
  assert.ok(res);
});

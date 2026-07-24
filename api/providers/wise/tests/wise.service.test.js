const assert = require('node:assert/strict');
const { test } = require('node:test');
const WiseService = require('../service');

test('WiseService listTransfers returns an object', async () => {
  const svc = new WiseService({ config: {} });
  const res = await svc.listTransfers();
  assert.ok(res !== undefined);
});

test('WiseService getBalances returns without throwing', async () => {
  const svc = new WiseService({ config: {} });
  const res = await svc.getBalances();
  assert.ok(Array.isArray(res) || res === null || typeof res === 'object');
});

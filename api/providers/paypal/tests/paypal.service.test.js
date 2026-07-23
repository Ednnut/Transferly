const PayPalService = require('../service');

describe('PayPalService (smoke)', () => {
  test('listTransactions returns an object', async () => {
    const svc = new PayPalService({ config: {} });
    const res = await svc.listTransactions();
    expect(res).toBeDefined();
  });
});

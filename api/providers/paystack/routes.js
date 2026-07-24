const express = require('express');
const PaystackService = require('./service');

const router = express.Router();
const service = new PaystackService({
  config: { secretKey: process.env.PAYSTACK_SECRET_KEY }
});

router.get('/balance', async (_req, res) => {
  try {
    const data = await service.getBalance();
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch balance' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const data = await service.listTransactions(req.query);
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch transactions' });
  }
});

module.exports = router;

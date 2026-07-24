const express = require('express');
const FlutterwaveService = require('./service');

const router = express.Router();
const service = new FlutterwaveService({
  config: { secretKey: process.env.FLUTTERWAVE_SECRET_KEY }
});

router.get('/balance', async (req, res) => {
  try {
    const data = await service.getBalance(req.query.currency);
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

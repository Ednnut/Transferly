const express = require('express');
const router = express.Router();
const PayPalService = require('./service');

const service = new PayPalService({ config: { clientId: process.env.PAYPAL_CLIENT_ID, clientSecret: process.env.PAYPAL_CLIENT_SECRET, env: process.env.PAYPAL_ENVIRONMENT || 'sandbox' } });

router.get('/balance', async (req, res) => {
  try {
    const data = await service.getBalance();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch balance' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const data = await service.listTransactions(req.query);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch transactions' });
  }
});

module.exports = router;

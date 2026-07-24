const express = require('express');
const StripeService = require('./service');

const router = express.Router();
const service = new StripeService({
  config: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    apiVersion: process.env.STRIPE_API_VERSION,
    baseUrl: process.env.STRIPE_API_BASE_URL
  }
});

router.get('/balance', async (_req, res) => {
  try {
    const data = await service.getBalance();
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch balance' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const data = await service.listPayments(req.query);
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch payments' });
  }
});

module.exports = router;

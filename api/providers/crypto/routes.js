const express = require('express');
const CryptoCommerceService = require('./service');

const router = express.Router();
const service = new CryptoCommerceService({
  config: { apiKey: process.env.CRYPTO_COMMERCE_API_KEY }
});

router.get('/charges', async (req, res) => {
  try {
    const data = await service.listCharges(req.query);
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch charges' });
  }
});

router.get('/charges/:chargeId', async (req, res) => {
  try {
    const data = await service.getCharge(req.params.chargeId);
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch charge' });
  }
});

module.exports = router;

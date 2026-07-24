const express = require('express');
const WiseService = require('./service');

const router = express.Router();
const service = new WiseService({
  config: {
    apiToken: process.env.WISE_API_TOKEN,
    profileId: process.env.WISE_PROFILE_ID
  }
});

router.get('/balances', async (_req, res) => {
  try {
    const data = await service.getBalances();
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch balances' });
  }
});

router.get('/transfers', async (req, res) => {
  try {
    const data = await service.listTransfers(req.query);
    res.json({ ok: true, data });
  } catch (_err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch transfers' });
  }
});

module.exports = router;

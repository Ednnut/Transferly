// Stripe webhook receiver scaffold

const express = require('express');
const router = express.Router();

router.post('/stripe', (req, res) => {
  // Providers must verify Stripe-Signature header before processing
  console.info('Received stripe webhook', { type: req.body?.type });
  res.status(200).send({ ok: true });
});

module.exports = router;

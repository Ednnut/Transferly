'use strict';

/**
 * Paystack webhook router — mounted at /webhooks/paystack
 *
 * Security contract:
 *  - Paystack signs webhooks with HMAC-SHA512 using PAYSTACK_SECRET_KEY.
 *    The X-Paystack-Signature header contains the hex digest.
 *  - Deduplication is by event id (data.id field).
 *  - Return HTTP 200 immediately; heavy work is queued.
 *
 * Docs: https://paystack.com/docs/payments/webhooks/
 */

const crypto = require('node:crypto');
const express = require('express');
const { logger } = require('../../utils/logger');

const router = express.Router();

// ---------------------------------------------------------------------------
// Signature verification (HMAC-SHA512)
// ---------------------------------------------------------------------------

function verifyPaystackSignature(rawBody, sigHeader, secretKey) {
  if (!secretKey || !sigHeader) return false;
  try {
    const expected = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(sigHeader.toLowerCase(), 'hex'),
      Buffer.from(expected.toLowerCase(), 'hex')
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

const seen = new Set();
const SEEN_MAX = 5000;

function isDuplicate(eventId) {
  if (!eventId) return false;
  if (seen.has(String(eventId))) return true;
  if (seen.size >= SEEN_MAX) seen.delete(seen.values().next().value);
  seen.add(String(eventId));
  return false;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

router.post('/', (req, res) => {
  const rawBody = req.rawBody || req.body;
  const sigHeader = req.headers['x-paystack-signature'] || '';
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';

  if (secretKey) {
    const valid = verifyPaystackSignature(rawBody, sigHeader, secretKey);
    if (!valid) {
      logger.warn({ provider: 'paystack' }, 'paystack:webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    logger.warn({ provider: 'paystack' }, 'paystack:webhook PAYSTACK_SECRET_KEY not set — skipping verification (dev mode)');
  }

  let event;
  try {
    event = typeof rawBody === 'string' || Buffer.isBuffer(rawBody)
      ? JSON.parse(rawBody.toString('utf8'))
      : rawBody;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventId = event?.data?.id;
  const eventType = event?.event;

  if (isDuplicate(eventId)) {
    logger.info({ provider: 'paystack', eventId, eventType }, 'paystack:webhook duplicate — skipping');
    return res.status(200).json({ ok: true, duplicate: true });
  }

  logger.info({ provider: 'paystack', eventId, eventType }, 'paystack:webhook received');

  setImmediate(() => {
    try {
      const { processWebhookEvent } = require('./jobs');
      processWebhookEvent({ data: { event } }).catch((err) => {
        logger.error({ err, provider: 'paystack', eventId, eventType }, 'paystack:webhook job failed');
      });
    } catch (err) {
      logger.error({ err, provider: 'paystack', eventId }, 'paystack:webhook job dispatch error');
    }
  });

  return res.status(200).json({ ok: true });
});

module.exports = router;

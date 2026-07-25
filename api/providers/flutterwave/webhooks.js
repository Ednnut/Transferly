'use strict';

/**
 * Flutterwave webhook router — mounted at /webhooks/flutterwave
 *
 * Security contract:
 *  - Flutterwave sends the secret hash in the verif-hash header.
 *    Compare it directly (constant-time) to FLUTTERWAVE_WEBHOOK_SECRET.
 *  - Deduplication is by event id (data.id).
 *  - Return HTTP 200 immediately; heavy work is queued.
 *
 * Docs: https://developer.flutterwave.com/docs/integration-guides/webhooks/
 */

const crypto = require('node:crypto');
const express = require('express');
const { logger } = require('../../utils/logger');

const router = express.Router();

// ---------------------------------------------------------------------------
// Signature verification (secret hash comparison)
// ---------------------------------------------------------------------------

function verifyFlutterwaveSignature(secretHash, receivedHash) {
  if (!secretHash || !receivedHash) return false;
  try {
    const a = Buffer.from(secretHash, 'utf8');
    const b = Buffer.from(receivedHash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
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
  const receivedHash = req.headers['verif-hash'] || '';
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';

  if (secretHash) {
    const valid = verifyFlutterwaveSignature(secretHash, receivedHash);
    if (!valid) {
      logger.warn({ provider: 'flutterwave' }, 'flutterwave:webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    logger.warn({ provider: 'flutterwave' }, 'flutterwave:webhook FLUTTERWAVE_WEBHOOK_SECRET not set — skipping verification (dev mode)');
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
    logger.info({ provider: 'flutterwave', eventId, eventType }, 'flutterwave:webhook duplicate — skipping');
    return res.status(200).json({ ok: true, duplicate: true });
  }

  logger.info({ provider: 'flutterwave', eventId, eventType }, 'flutterwave:webhook received');

  setImmediate(() => {
    try {
      const { processWebhookEvent } = require('./jobs');
      processWebhookEvent({ data: { event } }).catch((err) => {
        logger.error({ err, provider: 'flutterwave', eventId, eventType }, 'flutterwave:webhook job failed');
      });
    } catch (err) {
      logger.error({ err, provider: 'flutterwave', eventId }, 'flutterwave:webhook job dispatch error');
    }
  });

  return res.status(200).json({ ok: true });
});

module.exports = router;

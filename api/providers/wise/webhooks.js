'use strict';

/**
 * Wise webhook router — mounted at /webhooks/wise
 *
 * Security contract:
 *  - Wise signs webhooks with RSA-SHA256 using their public key.
 *    The X-Signature-SHA256 header contains a base64-encoded RSA signature
 *    over the raw request body.
 *  - When WISE_WEBHOOK_PUBLIC_KEY is configured, verification is enforced.
 *  - Deduplication is by event id.
 *  - Return HTTP 200 immediately; heavy work is queued.
 *
 * Docs: https://docs.wise.com/api-docs/features/webhooks-notifications
 */

const crypto = require('node:crypto');
const express = require('express');
const { logger } = require('../../utils/logger');

const router = express.Router();

// ---------------------------------------------------------------------------
// Signature verification (RSA-SHA256)
// ---------------------------------------------------------------------------

/**
 * Verify Wise RSA-SHA256 webhook signature.
 *
 * @param {Buffer|string} rawBody
 * @param {string} signatureHeader  Base64-encoded RSA signature
 * @param {string} publicKeyPem     Wise webhook public key (PEM)
 * @returns {boolean}
 */
function verifyWiseSignature(rawBody, signatureHeader, publicKeyPem) {
  if (!publicKeyPem || !signatureHeader) return false;
  try {
    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    return crypto.verify(
      'sha256',
      body,
      { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
      Buffer.from(signatureHeader, 'base64')
    );
  } catch {
    // Try PKCS1v15 as fallback (Wise uses PSS on newer endpoints)
    try {
      const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
      return crypto.verify(
        'sha256WithRSAEncryption',
        body,
        publicKeyPem,
        Buffer.from(signatureHeader, 'base64')
      );
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

const seen = new Set();
const SEEN_MAX = 5000;

function isDuplicate(eventId) {
  if (!eventId) return false;
  if (seen.has(eventId)) return true;
  if (seen.size >= SEEN_MAX) seen.delete(seen.values().next().value);
  seen.add(eventId);
  return false;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

router.post('/', (req, res) => {
  const rawBody = req.rawBody || req.body;
  const sigHeader = req.headers['x-signature-sha256'] || req.headers['x-signature'] || '';
  const publicKey = process.env.WISE_WEBHOOK_PUBLIC_KEY || '';

  if (publicKey) {
    const valid = verifyWiseSignature(rawBody, sigHeader, publicKey);
    if (!valid) {
      logger.warn({ provider: 'wise' }, 'wise:webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } else {
    logger.warn({ provider: 'wise' }, 'wise:webhook WISE_WEBHOOK_PUBLIC_KEY not set — skipping verification (dev mode)');
  }

  let event;
  try {
    event = typeof rawBody === 'string' || Buffer.isBuffer(rawBody)
      ? JSON.parse(rawBody.toString('utf8'))
      : rawBody;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventId = event?.event_type === 'ping' ? null : (event?.data?.resource?.id || event?.data?.id);
  const eventType = event?.event_type;

  if (eventType === 'ping') {
    logger.info({ provider: 'wise' }, 'wise:webhook ping received');
    return res.status(200).json({ ok: true });
  }

  if (isDuplicate(eventId)) {
    logger.info({ provider: 'wise', eventId, eventType }, 'wise:webhook duplicate — skipping');
    return res.status(200).json({ ok: true, duplicate: true });
  }

  logger.info({ provider: 'wise', eventId, eventType }, 'wise:webhook received');

  setImmediate(() => {
    try {
      const { processWebhookEvent } = require('./jobs');
      processWebhookEvent({ data: { event } }).catch((err) => {
        logger.error({ err, provider: 'wise', eventId, eventType }, 'wise:webhook job failed');
      });
    } catch (err) {
      logger.error({ err, provider: 'wise', eventId }, 'wise:webhook job dispatch error');
    }
  });

  return res.status(200).json({ ok: true });
});

module.exports = router;

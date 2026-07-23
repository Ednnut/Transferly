const { randomUUID } = require('node:crypto');
const { db } = require('../db');
const nacl = require('tweetnacl');

async function createChallenge(userId) {
  const challenge = `tc:${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await db.run(
    `INSERT INTO idempotency_records (id, user_id, idempotency_key, operation, request_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [challenge, userId, challenge, 'tonconnect.challenge', challenge, new Date().toISOString()]
  );
  return { challenge, expiresAt };
}

// Expect proof: { challenge, address, signature, publicKey }
// signature and publicKey should be base64-encoded strings from the TonConnect client.
async function verifyProof(userId, { challenge, address, signature, publicKey }) {
  if (!challenge || !address || !signature || !publicKey) {
    throw new Error('INVALID_PROOF');
  }

  // Validate challenge exists and belongs to the user (best-effort)
  const record = await db.get(
    `SELECT id, user_id, created_at FROM idempotency_records WHERE id = ? AND operation = ? LIMIT 1`,
    [challenge, 'tonconnect.challenge']
  );
  if (!record) {
    throw new Error('UNKNOWN_CHALLENGE');
  }
  if (record.user_id !== userId) {
    throw new Error('CHALLENGE_USER_MISMATCH');
  }

  // Verify signature using ed25519 (tweetnacl). Client must provide publicKey in base64.
  let sigBuf, pubBuf, msgBuf;
  try {
    sigBuf = Buffer.from(signature, 'base64');
    pubBuf = Buffer.from(publicKey, 'base64');
    msgBuf = Buffer.from(String(challenge), 'utf8');
  } catch (_) {
    throw new Error('INVALID_PROOF_ENCODING');
  }

  const verified = nacl.sign.detached.verify(
    new Uint8Array(msgBuf),
    new Uint8Array(sigBuf),
    new Uint8Array(pubBuf)
  );

  if (!verified) {
    throw new Error('INVALID_SIGNATURE');
  }

  // Persist wallet link into wallet_links table
  const id = `wl:${randomUUID()}`;
  const now = new Date().toISOString();
  const public_key_hex = pubBuf.toString('hex');

  await db.run(
    `INSERT INTO wallet_links (id, user_id, address, public_key_hex, metadata_json, verified_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, address, public_key_hex, null, now, now, now]
  );

  return { linked: true, id };
}

async function listForUser(userId) {
  const rows = await db.all(
    `SELECT id, address, public_key_hex, metadata_json, verified_at, created_at FROM wallet_links WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function unlink(userId, id) {
  const result = await db.run(`DELETE FROM wallet_links WHERE id = ? AND user_id = ?`, [id, userId]);
  return result.changes > 0;
}

module.exports = {
  walletLinkService: {
    createChallenge,
    verifyProof,
    listForUser,
    unlink
  }
};
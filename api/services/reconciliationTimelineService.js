'use strict';

const { db } = require('../db');
const { auditLogRepository } = require('../repositories/auditLogRepository');
const { invoiceRepository } = require('../repositories/invoiceRepository');
const { payoutRepository } = require('../repositories/payoutRepository');
const { webhookEventRepository } = require('../repositories/webhookEventRepository');
const { INVOICE_STATUS, PAYOUT_STATUS, WEBHOOK_PROCESSING_STATUS } = require('../utils/constants');

// How long (ms) a payout can stay in a non-terminal state before flagged stale
const STALE_PAYOUT_MS = 24 * 60 * 60 * 1000; // 24 h
const STALE_INVOICE_MS = 72 * 60 * 60 * 1000; // 72 h

const TERMINAL_INVOICE = new Set([INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED, INVOICE_STATUS.REFUNDED, INVOICE_STATUS.FAILED]);
const TERMINAL_PAYOUT = new Set([PAYOUT_STATUS.SUCCESS, PAYOUT_STATUS.FAILED, PAYOUT_STATUS.DENIED, PAYOUT_STATUS.REJECTED]);

function ageMs(isoString) {
  return Date.now() - Date.parse(isoString || 0);
}

// ── Ledger entries for an entity ─────────────────────────────────────────────

async function fetchLedgerEntries(referenceType, referenceId, limit = 50) {
  const rows = await db.all(
    `SELECT id, type, debit_bucket, credit_bucket, amount_cents, currency_code,
            reference_type, reference_id, description, created_at
     FROM ledger_entries
     WHERE reference_type = ? AND reference_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [referenceType, referenceId, limit]
  );
  return rows.map((r) => ({
    kind: 'ledger',
    id: r.id,
    type: r.type,
    debitBucket: r.debit_bucket,
    creditBucket: r.credit_bucket,
    amountCents: r.amount_cents,
    currencyCode: r.currency_code,
    description: r.description,
    timestamp: r.created_at
  }));
}

// ── Unified timeline for a single entity ─────────────────────────────────────

async function getEntityTimeline({ entityType, entityId, limit = 50 }) {
  const [auditLogs, ledgerEntries] = await Promise.all([
    auditLogRepository.findManyForEntity(entityType, entityId, { limit }),
    fetchLedgerEntries(entityType, entityId, limit)
  ]);

  const auditItems = auditLogs.map((e) => ({
    kind: 'audit',
    id: e.id,
    action: e.action,
    actorType: e.actorType,
    actorId: e.actorId,
    metadata: e.metadata,
    timestamp: e.createdAt
  }));

  const items = [...auditItems, ...ledgerEntries].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  );

  return { entityType, entityId, items };
}

// ── Cross-entity mismatch detection ──────────────────────────────────────────

async function detectMismatches({ invoiceLimit = 50, payoutLimit = 50, webhookLimit = 100 } = {}) {
  const [invoices, payouts, webhooks] = await Promise.all([
    invoiceRepository.findMany({ limit: invoiceLimit }),
    payoutRepository.findMany({ limit: payoutLimit }),
    webhookEventRepository.findMany({ limit: webhookLimit })
  ]);

  const mismatches = [];

  // 1. Stale pending invoices — sent but not paid/cancelled for > 72 h
  for (const inv of invoices) {
    if (!TERMINAL_INVOICE.has(inv.status) && ageMs(inv.updatedAt || inv.createdAt) > STALE_INVOICE_MS) {
      mismatches.push({
        type: 'stale_pending_invoice',
        severity: 'medium',
        entityType: 'invoice',
        entityId: inv.id,
        detail: `Invoice ${inv.id} has been in status "${inv.status}" for over 72 h`,
        since: inv.updatedAt || inv.createdAt
      });
    }
  }

  // 2. Stale pending payouts — non-terminal for > 24 h
  for (const payout of payouts) {
    if (!TERMINAL_PAYOUT.has(payout.status) && ageMs(payout.updatedAt || payout.createdAt) > STALE_PAYOUT_MS) {
      mismatches.push({
        type: 'stale_pending_payout',
        severity: 'high',
        entityType: 'payout',
        entityId: payout.id,
        detail: `Payout ${payout.id} has been in status "${payout.status}" for over 24 h`,
        since: payout.updatedAt || payout.createdAt
      });
    }
  }

  // 3. Failed webhook processing — events that failed and were never retried to success
  const failedWebhooks = webhooks.filter((w) => w.status === WEBHOOK_PROCESSING_STATUS.FAILED);
  for (const wh of failedWebhooks) {
    mismatches.push({
      type: 'failed_webhook',
      severity: 'high',
      entityType: 'webhook_event',
      entityId: wh.id,
      detail: `Webhook event ${wh.eventId || wh.id} (${wh.eventType}) failed processing after ${wh.processingAttempts} attempt(s)`,
      since: wh.updatedAt || wh.createdAt
    });
  }

  // 4. Paid invoices with no ledger credit — webhook may have been missed
  const paidInvoiceIds = invoices.filter((i) => i.status === INVOICE_STATUS.PAID).map((i) => i.id);
  if (paidInvoiceIds.length > 0) {
    const placeholders = paidInvoiceIds.map(() => '?').join(',');
    const ledgerRows = await db.all(
      `SELECT DISTINCT reference_id FROM ledger_entries
       WHERE reference_type = 'invoice' AND reference_id IN (${placeholders})`,
      paidInvoiceIds
    );
    const coveredIds = new Set(ledgerRows.map((r) => r.reference_id));
    for (const id of paidInvoiceIds) {
      if (!coveredIds.has(id)) {
        mismatches.push({
          type: 'missing_ledger_credit',
          severity: 'critical',
          entityType: 'invoice',
          entityId: id,
          detail: `Invoice ${id} is PAID but has no ledger entry — webhook may have been missed`,
          since: null
        });
      }
    }
  }

  return {
    checked_at: new Date().toISOString(),
    mismatch_count: mismatches.length,
    mismatches
  };
}

module.exports = {
  reconciliationTimelineService: {
    getEntityTimeline,
    detectMismatches
  }
};

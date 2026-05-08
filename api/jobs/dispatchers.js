const config = require('../config');
const { paypalInvoiceService } = require('../services/paypalInvoiceService');
const { paymentReconciliationService } = require('../services/paymentReconciliationService');
const { paypalPayoutService } = require('../services/paypalPayoutService');
const { webhookService } = require('../services/webhookService');

async function dispatchInvoiceCreation(payload) {
  if (config.INLINE_QUEUE_MODE) {
    return paypalInvoiceService.createAndSendInvoice(payload);
  }

  const { invoiceSendQueue, invoiceSendQueueEvents } = require('./queues');
  const job = await invoiceSendQueue.add('create-and-send-invoice', payload);
  return job.waitUntilFinished(invoiceSendQueueEvents, config.JOB_WAIT_MS);
}

async function dispatchPayoutProcessing(payoutId, jobName, jobId) {
  if (config.INLINE_QUEUE_MODE) {
    return paypalPayoutService.processQueuedPayout(payoutId);
  }

  const { payoutProcessQueue, payoutProcessQueueEvents } = require('./queues');
  const job = await payoutProcessQueue.add(jobName, { payoutId }, { jobId });
  return job.waitUntilFinished(payoutProcessQueueEvents, config.JOB_WAIT_MS);
}

async function enqueueWebhookProcessing(webhookEventId, eventId) {
  if (config.INLINE_QUEUE_MODE) {
    await webhookService.processWebhookEvent(webhookEventId);
    return;
  }

  const { webhookProcessQueue } = require('./queues');
  await webhookProcessQueue.add(
    'process-paypal-webhook',
    { webhookEventId },
    { jobId: `webhook:${eventId}` }
  );
}

async function dispatchPaymentReconciliation(payload = {}) {
  if (config.INLINE_QUEUE_MODE) {
    return paymentReconciliationService.runPaymentReconciliation(payload);
  }

  const { reconciliationQueue, reconciliationQueueEvents } = require('./queues');
  const job = await reconciliationQueue.add('run-payment-reconciliation', payload);
  return job.waitUntilFinished(reconciliationQueueEvents, config.JOB_WAIT_MS);
}

module.exports = {
  dispatchInvoiceCreation,
  dispatchPayoutProcessing,
  enqueueWebhookProcessing,
  dispatchPaymentReconciliation
};

const config = require('../config');
const { orderRepository } = require('../repositories/orderRepository');
const { orderService } = require('../services/orderService');
const { providerInvoiceService } = require('../services/providerInvoiceService');
const { paymentReconciliationService } = require('../services/paymentReconciliationService');
const { payoutProcessingService } = require('../services/payoutProcessingService');
const { webhookService } = require('../services/webhookService');
const { AppError } = require('../utils/errors');
const { buildOrderDispatchIdentity } = require('../utils/orderDispatch');
const { buildQueueJobId } = require('../utils/queueJobId');

async function dispatchInvoiceCreation(payload) {
  if (config.INLINE_QUEUE_MODE) {
    return providerInvoiceService.createAndSendInvoice(payload);
  }

  const { invoiceSendQueue, invoiceSendQueueEvents } = require('./queues');
  const job = await invoiceSendQueue.add('create-and-send-invoice', payload);
  return job.waitUntilFinished(invoiceSendQueueEvents, config.JOB_WAIT_MS);
}

async function dispatchOrderProcessing(orderId) {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  }

  const dispatchIdentity = buildOrderDispatchIdentity(order);

  if (config.INLINE_QUEUE_MODE) {
    return orderService.processQueuedOrder({
      ...dispatchIdentity.payload,
      jobId: `inline-${dispatchIdentity.jobId}`
    });
  }

  const { orderProcessQueue } = require('./queues');
  const job = await orderProcessQueue.add(
    'process-order',
    dispatchIdentity.payload,
    { jobId: dispatchIdentity.jobId }
  );

  await orderService.markOrderDispatched({
    orderId,
    jobId: job.id,
    dispatchGeneration: dispatchIdentity.dispatchGeneration
  });

  return {
    orderId,
    jobId: job.id,
    dispatchGeneration: dispatchIdentity.dispatchGeneration
  };
}

async function dispatchPendingOrders({ limit = 25 } = {}) {
  const orders = await orderRepository.findDispatchPending({ limit });
  const results = [];

  for (const order of orders) {
    try {
      const result = await dispatchOrderProcessing(order.id);
      results.push({
        orderId: order.id,
        dispatched: true,
        result
      });
    } catch (error) {
      results.push({
        orderId: order.id,
        dispatched: false,
        error: {
          code: error.code || 'ORDER_DISPATCH_FAILED',
          message: error.message
        }
      });
    }
  }

  return {
    scanned: orders.length,
    dispatched: results.filter((result) => result.dispatched).length,
    failed: results.filter((result) => !result.dispatched).length,
    results
  };
}

async function dispatchPayoutProcessing(payoutId, jobName) {
  if (config.INLINE_QUEUE_MODE) {
    return payoutProcessingService.processQueuedPayout(payoutId);
  }

  const { payoutProcessQueue, payoutProcessQueueEvents } = require('./queues');
  const job = await payoutProcessQueue.add(
    jobName,
    { payoutId },
    { jobId: buildQueueJobId('payout', jobName, payoutId) }
  );
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
    { jobId: buildQueueJobId('webhook', eventId) }
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
  dispatchOrderProcessing,
  dispatchPendingOrders,
  dispatchPayoutProcessing,
  enqueueWebhookProcessing,
  dispatchPaymentReconciliation
};

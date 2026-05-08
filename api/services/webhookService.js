const config = require('../config');
const { PayPalClient } = require('../adapters/paypalClient');
const { webhookEventRepository } = require('../repositories/webhookEventRepository');
const { auditLogService } = require('./auditLogService');
const { paypalWebhookHandlers } = require('../webhooks/paypalWebhookHandlers');
const { AppError } = require('../utils/errors');
const { AUDIT_ACTOR_TYPE, WEBHOOK_PROCESSING_STATUS } = require('../utils/constants');

const paypalClient = new PayPalClient(
  config.PAYPAL_CLIENT_ID,
  config.PAYPAL_CLIENT_SECRET,
  config.PAYPAL_ENVIRONMENT
);

async function ingestPayPalEvent(headers, event) {
  const eventId = String(event.id || '');
  if (!eventId) {
    throw new AppError(400, 'INVALID_WEBHOOK_EVENT', 'Webhook event id is required.');
  }

  const existing = await webhookEventRepository.findByEventId(eventId);
  if (existing) {
    return {
      duplicate: true,
      webhookEvent: existing
    };
  }

  const webhookEvent = await webhookEventRepository.create({
    eventId,
    eventType: String(event.event_type || 'unknown'),
    resourceType: typeof event.resource_type === 'string' ? event.resource_type : null,
    transmissionId: headers.transmissionId,
    status: WEBHOOK_PROCESSING_STATUS.RECEIVED,
    payload: event,
    verificationPayload: null
  });

  const verificationPayload = {
    auth_algo: headers.authAlgo,
    cert_url: headers.certUrl,
    transmission_id: headers.transmissionId,
    transmission_sig: headers.transmissionSig,
    transmission_time: headers.transmissionTime,
    webhook_id: config.PAYPAL_WEBHOOK_ID,
    webhook_event: event
  };

  const verification = await paypalClient.verifyWebhookSignature(verificationPayload);
  if (verification.verification_status !== 'SUCCESS') {
    const rejected = await webhookEventRepository.update(webhookEvent.id, {
      status: WEBHOOK_PROCESSING_STATUS.REJECTED,
      verificationPayload,
      lastError: `Verification status: ${verification.verification_status}`
    });

    await auditLogService.log({
      actorType: AUDIT_ACTOR_TYPE.WEBHOOK,
      action: 'webhook.rejected',
      entityType: 'webhook_event',
      entityId: rejected.id,
      metadata: {
        eventId,
        verificationStatus: verification.verification_status
      }
    });

    throw new AppError(400, 'INVALID_WEBHOOK_SIGNATURE', 'PayPal webhook signature verification failed.');
  }

  const verified = await webhookEventRepository.update(webhookEvent.id, {
    status: WEBHOOK_PROCESSING_STATUS.VERIFIED,
    verificationPayload,
    lastError: null
  });

  await auditLogService.log({
    actorType: AUDIT_ACTOR_TYPE.WEBHOOK,
    action: 'webhook.received',
    entityType: 'webhook_event',
    entityId: verified.id,
    metadata: {
      eventId
    }
  });

  return {
    duplicate: false,
    webhookEvent: verified
  };
}

async function processWebhookEvent(webhookEventId) {
  const webhookEvent = await webhookEventRepository.findById(webhookEventId);
  if (!webhookEvent) {
    throw new AppError(404, 'WEBHOOK_EVENT_NOT_FOUND', 'Webhook event not found.');
  }

  const nextAttempt = webhookEvent.processingAttempts + 1;
  await webhookEventRepository.update(webhookEvent.id, {
    processingAttempts: nextAttempt
  });

  const event = webhookEvent.payload;

  try {
    switch (webhookEvent.eventType) {
      case 'INVOICING.INVOICE.CREATED':
        await paypalWebhookHandlers.handleInvoiceCreated(event);
        break;
      case 'INVOICING.INVOICE.SCHEDULED':
        await paypalWebhookHandlers.handleInvoiceScheduled(event);
        break;
      case 'INVOICING.INVOICE.PAID':
        await paypalWebhookHandlers.handleInvoicePaid(event);
        break;
      case 'INVOICING.INVOICE.CANCELLED':
        await paypalWebhookHandlers.handleInvoiceCancelled(event);
        break;
      case 'INVOICING.INVOICE.REFUNDED':
        await paypalWebhookHandlers.handleInvoiceRefunded(event);
        break;
      case 'INVOICING.INVOICE.UPDATED':
        await paypalWebhookHandlers.handleInvoiceUpdated(event);
        break;
      case 'PAYMENT.PAYOUTSBATCH.PROCESSING':
      case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
      case 'PAYMENT.PAYOUTSBATCH.DENIED':
      case 'PAYMENT.PAYOUTS-ITEM.BLOCKED':
      case 'PAYMENT.PAYOUTS-ITEM.CANCELED':
      case 'PAYMENT.PAYOUTS-ITEM.DENIED':
      case 'PAYMENT.PAYOUTS-ITEM.FAILED':
      case 'PAYMENT.PAYOUTS-ITEM.HELD':
      case 'PAYMENT.PAYOUTS-ITEM.PROCESSING':
      case 'PAYMENT.PAYOUTS-ITEM.REFUNDED':
      case 'PAYMENT.PAYOUTS-ITEM.RETURNED':
      case 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED':
      case 'PAYMENT.PAYOUTS-ITEM.UNCLAIMED':
        await paypalWebhookHandlers.handlePayoutEvent(event);
        break;
      default:
        await webhookEventRepository.update(webhookEvent.id, {
          status: WEBHOOK_PROCESSING_STATUS.IGNORED,
          processedAt: new Date().toISOString(),
          lastError: null
        });
        return {
          status: WEBHOOK_PROCESSING_STATUS.IGNORED
        };
    }
  } catch (error) {
    await webhookEventRepository.update(webhookEvent.id, {
      status: WEBHOOK_PROCESSING_STATUS.FAILED,
      lastError: error.message
    });
    throw error;
  }

  await webhookEventRepository.update(webhookEvent.id, {
    status: WEBHOOK_PROCESSING_STATUS.PROCESSED,
    processedAt: new Date().toISOString(),
    lastError: null
  });

  return {
    status: WEBHOOK_PROCESSING_STATUS.PROCESSED
  };
}

module.exports = {
  webhookService: {
    ingestPayPalEvent,
    processWebhookEvent
  }
};

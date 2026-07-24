// Stripe background job stubs (BullMQ)

async function processWebhookEvent(job) {
  const { event } = job.data;
  // Verify Stripe-Signature, dedupe, dispatch to service layer
  console.info('Processing Stripe webhook event', event?.type);
  return { ok: true };
}

module.exports = {
  processWebhookEvent
};

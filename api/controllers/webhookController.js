const { enqueueWebhookProcessing } = require('../jobs/dispatchers');
const { paypalWebhookHeadersSchema } = require('../schemas/webhookSchemas');
const { webhookService } = require('../services/webhookService');

async function handlePayPalWebhookController(request, response) {
  const headers = paypalWebhookHeadersSchema.parse(request.headers);
  const event = request.body;

  const result = await webhookService.ingestPayPalEvent(
    {
      authAlgo: headers['paypal-auth-algo'],
      certUrl: headers['paypal-cert-url'],
      transmissionId: headers['paypal-transmission-id'],
      transmissionSig: headers['paypal-transmission-sig'],
      transmissionTime: headers['paypal-transmission-time']
    },
    event
  );

  if (!result.duplicate) {
    await enqueueWebhookProcessing(result.webhookEvent.id, result.webhookEvent.eventId);
  }

  response.status(result.duplicate ? 200 : 202).json({
    received: true,
    duplicate: result.duplicate,
    event_id: result.webhookEvent.eventId
  });
}

module.exports = {
  handlePayPalWebhookController
};

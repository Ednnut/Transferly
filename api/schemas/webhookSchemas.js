const { z } = require('zod');

const paypalWebhookHeadersSchema = z.object({
  'paypal-auth-algo': z.string().min(1),
  'paypal-cert-url': z.string().url(),
  'paypal-transmission-id': z.string().min(1),
  'paypal-transmission-sig': z.string().min(1),
  'paypal-transmission-time': z.string().min(1)
});

module.exports = {
  paypalWebhookHeadersSchema
};

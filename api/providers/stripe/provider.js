const BaseProvider = require('../base-provider');

class StripeProvider extends BaseProvider {
  constructor({ config = {}, logger = console } = {}) {
    super({ id: 'stripe', name: 'Stripe Connect', config, logger });
  }

  createClient() {
    const StripeClient = require('./client');
    return new StripeClient({
      secretKey: this.config.secretKey,
      apiVersion: this.config.apiVersion,
      baseUrl: this.config.baseUrl,
      logger: this.logger
    });
  }

  async fetchTransactions(opts = {}) {
    const client = this.createClient();
    return client.listPaymentIntents(opts);
  }

  async handleWebhook(req, res) {
    // Providers must verify Stripe-Signature header before processing
    this.logger.info('stripe:webhook', { headers: req.headers });
    res.status(200).send({ ok: true });
  }
}

module.exports = StripeProvider;

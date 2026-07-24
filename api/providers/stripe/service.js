const StripeClient = require('./client');

class StripeService {
  constructor({ config = {}, logger = console } = {}) {
    this.config = config;
    this.logger = logger;
    this.client = new StripeClient({
      secretKey: config.secretKey,
      apiVersion: config.apiVersion,
      baseUrl: config.baseUrl,
      logger
    });
  }

  async getBalance() {
    try {
      return await this.client.getBalance();
    } catch (err) {
      this.logger.error({ err }, 'stripe.getBalance failed');
      throw err;
    }
  }

  async listPayments(opts = {}) {
    return this.client.listPaymentIntents(opts);
  }
}

module.exports = StripeService;

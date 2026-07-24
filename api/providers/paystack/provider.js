const BaseProvider = require('../base-provider');

class PaystackProvider extends BaseProvider {
  constructor({ config = {}, logger = console } = {}) {
    super({ id: 'paystack', name: 'Paystack', config, logger });
  }

  createClient() {
    const PaystackClient = require('./client');
    return new PaystackClient({ secretKey: this.config.secretKey, baseUrl: this.config.baseUrl, logger: this.logger });
  }

  async fetchTransactions(opts = {}) {
    return this.createClient().listTransactions(opts);
  }

  async handleWebhook(req, res) {
    // Providers must verify X-Paystack-Signature header before processing
    this.logger.info('paystack:webhook', { headers: req.headers });
    res.status(200).send({ ok: true });
  }
}

module.exports = PaystackProvider;

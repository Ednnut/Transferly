const BaseProvider = require('../base-provider');

class CryptoCommerceProvider extends BaseProvider {
  constructor({ config = {}, logger = console } = {}) {
    super({ id: 'crypto', name: 'Crypto Commerce', config, logger });
  }

  createClient() {
    const CryptoCommerceClient = require('./client');
    return new CryptoCommerceClient({ apiKey: this.config.apiKey, baseUrl: this.config.baseUrl, logger: this.logger });
  }

  async fetchTransactions(opts = {}) {
    return this.createClient().listCharges(opts);
  }

  async handleWebhook(req, res) {
    // Providers must verify X-CC-Webhook-Signature header before processing
    this.logger.info('crypto:webhook', { headers: req.headers });
    res.status(200).send({ ok: true });
  }
}

module.exports = CryptoCommerceProvider;

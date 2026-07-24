const BaseProvider = require('../base-provider');

class FlutterwaveProvider extends BaseProvider {
  constructor({ config = {}, logger = console } = {}) {
    super({ id: 'flutterwave', name: 'Flutterwave', config, logger });
  }

  createClient() {
    const FlutterwaveClient = require('./client');
    return new FlutterwaveClient({ secretKey: this.config.secretKey, baseUrl: this.config.baseUrl, logger: this.logger });
  }

  async fetchTransactions(opts = {}) {
    return this.createClient().listTransactions(opts);
  }

  async handleWebhook(req, res) {
    // Providers must verify verif-hash header before processing
    this.logger.info('flutterwave:webhook', { headers: req.headers });
    res.status(200).send({ ok: true });
  }
}

module.exports = FlutterwaveProvider;

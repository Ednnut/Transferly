const BaseProvider = require('../base-provider');

class WiseProvider extends BaseProvider {
  constructor({ config = {}, logger = console } = {}) {
    super({ id: 'wise', name: 'Wise Platform', config, logger });
  }

  createClient() {
    const WiseClient = require('./client');
    return new WiseClient({
      apiToken: this.config.apiToken,
      profileId: this.config.profileId,
      baseUrl: this.config.baseUrl,
      logger: this.logger
    });
  }

  async fetchTransactions(opts = {}) {
    const client = this.createClient();
    return client.listTransfers(opts);
  }

  async handleWebhook(req, res) {
    // Providers must verify X-Signature-SHA256 header before processing
    this.logger.info('wise:webhook', { headers: req.headers });
    res.status(200).send({ ok: true });
  }
}

module.exports = WiseProvider;

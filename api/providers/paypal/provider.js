const BaseProvider = require('../base-provider');

class PayPalProvider extends BaseProvider {
  constructor({ config = {}, logger = console } = {}) {
    super({ id: 'paypal', name: 'PayPal', config, logger });
  }

  createClient() {
    // Lightweight client stub — providers should implement robust clients with retries, timeouts
    const cfg = this.config;
    return {
      getBalance: async () => ({ available: 0, pending: 0 }),
      fetchTransactions: async (opts = {}) => ({ items: [], nextPage: null })
    };
  }

  async fetchTransactions(opts = {}) {
    const client = this.createClient();
    return client.fetchTransactions(opts);
  }

  async handleWebhook(req, res) {
    // Example non-destructive stub: providers must implement signature verification & idempotency
    this.logger.info('paypal:webhook', { headers: req.headers });
    res.status(200).send({ ok: true });
  }
}

module.exports = PayPalProvider;

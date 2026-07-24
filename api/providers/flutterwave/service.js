const FlutterwaveClient = require('./client');

class FlutterwaveService {
  constructor({ config = {}, logger = console } = {}) {
    this.config = config;
    this.logger = logger;
    this.client = new FlutterwaveClient({ secretKey: config.secretKey, baseUrl: config.baseUrl, logger });
  }

  async getBalance(currency) {
    try {
      return await this.client.getBalance(currency);
    } catch (err) {
      this.logger.error({ err }, 'flutterwave.getBalance failed');
      throw err;
    }
  }

  async listTransactions(opts = {}) {
    return this.client.listTransactions(opts);
  }
}

module.exports = FlutterwaveService;

const PaystackClient = require('./client');

class PaystackService {
  constructor({ config = {}, logger = console } = {}) {
    this.config = config;
    this.logger = logger;
    this.client = new PaystackClient({ secretKey: config.secretKey, baseUrl: config.baseUrl, logger });
  }

  async getBalance() {
    try {
      return await this.client.getBalance();
    } catch (err) {
      this.logger.error({ err }, 'paystack.getBalance failed');
      throw err;
    }
  }

  async listTransactions(opts = {}) {
    return this.client.listTransactions(opts);
  }
}

module.exports = PaystackService;

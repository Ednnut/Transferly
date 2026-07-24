const CryptoCommerceClient = require('./client');

class CryptoCommerceService {
  constructor({ config = {}, logger = console } = {}) {
    this.config = config;
    this.logger = logger;
    this.client = new CryptoCommerceClient({ apiKey: config.apiKey, baseUrl: config.baseUrl, logger });
  }

  async listCharges(opts = {}) {
    try {
      return await this.client.listCharges(opts);
    } catch (err) {
      this.logger.error({ err }, 'crypto.listCharges failed');
      throw err;
    }
  }

  async getCharge(chargeId) {
    return this.client.getCharge(chargeId);
  }
}

module.exports = CryptoCommerceService;

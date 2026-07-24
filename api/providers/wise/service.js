const WiseClient = require('./client');

class WiseService {
  constructor({ config = {}, logger = console } = {}) {
    this.config = config;
    this.logger = logger;
    this.client = new WiseClient({
      apiToken: config.apiToken,
      profileId: config.profileId,
      baseUrl: config.baseUrl,
      logger
    });
  }

  async getBalances() {
    try {
      return await this.client.getBalances();
    } catch (err) {
      this.logger.error({ err }, 'wise.getBalances failed');
      throw err;
    }
  }

  async listTransfers(opts = {}) {
    return this.client.listTransfers(opts);
  }
}

module.exports = WiseService;

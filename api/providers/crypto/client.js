// Lightweight Crypto Commerce client scaffold.
// Replace with production-ready client using retries, timeouts, and idempotency.
// Never log or expose API keys, wallet addresses, or private keys.

class CryptoCommerceClient {
  constructor({ apiKey, baseUrl = 'https://api.commerce.coinbase.com', logger = console } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  async fetch(_path, _opts = {}) {
    this.logger.debug('crypto.client.fetch', { path: _path });
    return { status: 200, data: null };
  }

  async listCharges(_params = {}) {
    const res = await this.fetch('/charges');
    return res.data || { data: [] };
  }

  async getCharge(_chargeId) {
    const res = await this.fetch(`/charges/${_chargeId}`);
    return res.data;
  }
}

module.exports = CryptoCommerceClient;

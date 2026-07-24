// Lightweight Flutterwave client scaffold.
// Replace with production-ready client using retries, timeouts, and idempotency.

class FlutterwaveClient {
  constructor({ secretKey, baseUrl = 'https://api.flutterwave.com/v3', logger = console } = {}) {
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  async fetch(_path, _opts = {}) {
    this.logger.debug('flutterwave.client.fetch', { path: _path });
    return { status: 200, data: null };
  }

  async getBalance(_currency = 'NGN') {
    const res = await this.fetch(`/balances/${_currency}`);
    return res.data;
  }

  async listTransactions(_params = {}) {
    const res = await this.fetch('/transactions');
    return res.data || { data: [] };
  }
}

module.exports = FlutterwaveClient;

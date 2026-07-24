// Lightweight Paystack client scaffold.
// Replace with production-ready client using retries, timeouts, and idempotency.

class PaystackClient {
  constructor({ secretKey, baseUrl = 'https://api.paystack.co', logger = console } = {}) {
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  async fetch(_path, _opts = {}) {
    this.logger.debug('paystack.client.fetch', { path: _path });
    return { status: 200, data: null };
  }

  async getBalance() {
    const res = await this.fetch('/balance');
    return res.data;
  }

  async listTransactions(_params = {}) {
    const res = await this.fetch('/transaction');
    return res.data || { data: [] };
  }
}

module.exports = PaystackClient;

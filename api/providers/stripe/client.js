// Lightweight Stripe client scaffold.
// Replace with production-ready client using retries, timeouts, idempotency, and OAuth.

class StripeClient {
  constructor({ secretKey, apiVersion = '2026-02-25.clover', baseUrl = 'https://api.stripe.com', logger = console } = {}) {
    this.secretKey = secretKey;
    this.apiVersion = apiVersion;
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  async fetch(_path, _opts = {}) {
    this.logger.debug('stripe.client.fetch', { path: _path });
    return { status: 200, data: null };
  }

  async getBalance() {
    const res = await this.fetch('/v1/balance');
    return res.data;
  }

  async listPaymentIntents(_params = {}) {
    const res = await this.fetch('/v1/payment_intents');
    return res.data || { data: [] };
  }
}

module.exports = StripeClient;

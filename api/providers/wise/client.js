// Lightweight Wise client scaffold.
// Replace with production-ready client using retries, timeouts, and idempotency.

class WiseClient {
  constructor({ apiToken, profileId, baseUrl = 'https://api.transferwise.com', logger = console } = {}) {
    this.apiToken = apiToken;
    this.profileId = profileId;
    this.baseUrl = baseUrl;
    this.logger = logger;
  }

  async fetch(_path, _opts = {}) {
    this.logger.debug('wise.client.fetch', { path: _path });
    return { status: 200, data: null };
  }

  async getBalances() {
    const res = await this.fetch(`/v4/profiles/${this.profileId}/balances?types=STANDARD`);
    return res.data || [];
  }

  async listTransfers(_params = {}) {
    const res = await this.fetch(`/v1/transfers?profile=${this.profileId}`);
    return res.data || { content: [] };
  }
}

module.exports = WiseClient;

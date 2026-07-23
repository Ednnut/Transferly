/*
BaseProvider: minimal abstract class for provider modules.
Each provider module should extend this and implement the required methods.
Non-destructive scaffold — existing provider code remains untouched.
*/

class BaseProvider {
  constructor({ id, name, config = {}, logger = console }) {
    if (!id || !name) throw new Error('BaseProvider requires id and name');
    this.id = id;
    this.name = name;
    this.config = config;
    this.logger = logger;
  }

  // Lifecycle
  async init() {
    this.logger.info(`${this.id}: init`);
  }

  async shutdown() {
    this.logger.info(`${this.id}: shutdown`);
  }

  // API client factory — providers implement
  createClient() {
    throw new Error('createClient() not implemented');
  }

  // Service operations
  async fetchTransactions(opts = {}) {
    throw new Error('fetchTransactions() not implemented');
  }

  async createPayment(opts = {}) {
    throw new Error('createPayment() not implemented');
  }

  // Webhook handler
  async handleWebhook(req, res) {
    res.status(501).send({ error: 'Not implemented' });
  }
}

module.exports = BaseProvider;

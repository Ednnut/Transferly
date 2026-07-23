const fs = require('node:fs');
const path = require('node:path');

class ProviderRegistry {
  constructor({ logger = console } = {}) {
    this.providers = new Map();
    this.logger = logger;
  }

  register(providerInstance) {
    if (!providerInstance || !providerInstance.id) throw new Error('Invalid provider');
    this.providers.set(providerInstance.id, providerInstance);
    this.logger.info(`Registered provider: ${providerInstance.id}`);
  }

  unregister(id) {
    this.providers.delete(id);
    this.logger.info(`Unregistered provider: ${id}`);
  }

  get(id) {
    return this.providers.get(id);
  }

  list() {
    return Array.from(this.providers.values());
  }

  // Discover provider modules in api/providers/* (non-destructive)
  discover(dir = path.join(__dirname)) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach((f) => {
      if (f.isDirectory()) return;
      const full = path.join(dir, f.name);
      if (/provider\.js$/.test(f.name)) {
        try {
          const mod = require(full);
          if (mod && mod.default) {
            const inst = new mod.default({});
            this.register(inst);
          } else if (typeof mod === 'function') {
            const inst = new mod({});
            this.register(inst);
          } else if (mod && mod.provider) {
            this.register(mod.provider);
          }
        } catch (err) {
          this.logger.warn(`Failed to load provider ${full}: ${err.message}`);
        }
      }
    });
  }
}

module.exports = ProviderRegistry;

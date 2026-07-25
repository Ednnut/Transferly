const { bootstrapRoutes, meRoutes, workspaceRoutes } = require('./bootstrapRoutes');
const { authRoutes } = require('./authRoutes');
const { assetRoutes } = require('./assetRoutes');
const { emailRoutes } = require('./emailRoutes');
const { invoiceRoutes } = require('./invoiceRoutes');
const { orderRoutes } = require('./orderRoutes');
const { payoutRoutes } = require('./payoutRoutes');
const { providerRoutes } = require('./providerRoutes');
const { adminRoutes } = require('./adminRoutes');
const { receiptRoutes } = require('./receiptRoutes');
const { referralRoutes } = require('./referralRoutes');
const { serviceRoutes } = require('./serviceRoutes');
const { telegramRoutes } = require('./telegramRoutes');
const { slipcraftUserRoutes } = require('./slipcraftUserRoutes');
const { webhookRoutes } = require('./webhookRoutes');
const { marketplaceRoutes } = require('./marketplaceRoutes');
const { walletLinkRoutes } = require('./walletLinkRoutes');
const { mountPerProviderRoutes } = require('../providers/shared/mountProviderRoutes');
const { logger } = require('../utils/logger');

function registerRoutes(app) {
  app.use('/api/bootstrap', bootstrapRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/user', slipcraftUserRoutes);
  app.use('/api/receipt', receiptRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/api/telegram', telegramRoutes);

  // Generic provider routes (dynamic /:provider/* — must come before per-provider mounts)
  app.use('/api/providers', providerRoutes);

  // Core webhook routes are mounted BEFORE per-provider webhooks so that existing
  // paypal/stripe/crypto handlers in webhookRoutes.js (which do real ledger work)
  // take precedence. Per-provider webhooks.js files handle providers not yet in
  // webhookRoutes.js (wise, paystack, flutterwave).
  app.use('/webhooks', webhookRoutes);

  // Per-provider extended routes and webhooks discovered from api/providers/<key>/routes.js
  // and api/providers/<key>/webhooks.js. Routes are auth-guarded; webhooks are not (signature-verified).
  const { mountedProviderRoutes, mountedWebhookRoutes } = mountPerProviderRoutes(app);
  if (mountedProviderRoutes.length || mountedWebhookRoutes.length) {
    logger.info({ mountedProviderRoutes, mountedWebhookRoutes }, 'per-provider routes mounted');
  }

  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/payouts', payoutRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/wallet-links', walletLinkRoutes);
}

module.exports = {
  registerRoutes
};

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
  app.use('/api/providers', providerRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/payouts', payoutRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/wallet-links', walletLinkRoutes);
  app.use('/webhooks', webhookRoutes);
}

module.exports = {
  registerRoutes
};

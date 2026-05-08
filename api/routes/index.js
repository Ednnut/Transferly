const { bootstrapRoutes, meRoutes } = require('./bootstrapRoutes');
const { authRoutes } = require('./authRoutes');
const { emailRoutes } = require('./emailRoutes');
const { invoiceRoutes } = require('./invoiceRoutes');
const { payoutRoutes } = require('./payoutRoutes');
const { adminRoutes } = require('./adminRoutes');
const { receiptRoutes } = require('./receiptRoutes');
const { referralRoutes } = require('./referralRoutes');
const { telegramRoutes } = require('./telegramRoutes');
const { slipcraftUserRoutes } = require('./slipcraftUserRoutes');
const { webhookRoutes } = require('./webhookRoutes');

function registerRoutes(app) {
  app.use('/api/bootstrap', bootstrapRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/user', slipcraftUserRoutes);
  app.use('/api/receipt', receiptRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/api/telegram', telegramRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payouts', payoutRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/webhooks', webhookRoutes);
}

module.exports = {
  registerRoutes
};

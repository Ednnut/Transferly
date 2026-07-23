const { stripeProviderAdapter } = require('../../adapters/paymentProviders/stripeProviderAdapter');
const { createProviderWorkspaceModule } = require('../shared/createProviderWorkspaceModule');
const { fixtures } = require('./fixtures');

module.exports = createProviderWorkspaceModule({
  key: 'stripe',
  adapter: stripeProviderAdapter,
  fixtures
});

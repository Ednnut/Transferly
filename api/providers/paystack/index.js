const { paystackProviderAdapter } = require('../../adapters/paymentProviders/paystackProviderAdapter');
const { createProviderWorkspaceModule } = require('../shared/createProviderWorkspaceModule');
const { fixtures } = require('./fixtures');

module.exports = createProviderWorkspaceModule({
  key: 'paystack',
  adapter: paystackProviderAdapter,
  fixtures
});

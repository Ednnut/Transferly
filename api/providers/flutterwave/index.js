const { flutterwaveProviderAdapter } = require('../../adapters/paymentProviders/flutterwaveProviderAdapter');
const { createProviderWorkspaceModule } = require('../shared/createProviderWorkspaceModule');
const { fixtures } = require('./fixtures');

module.exports = createProviderWorkspaceModule({
  key: 'flutterwave',
  adapter: flutterwaveProviderAdapter,
  fixtures
});

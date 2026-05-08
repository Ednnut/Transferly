const { bootstrapService } = require('../services/bootstrapService');

async function getBootstrapController(_request, response) {
  const result = await bootstrapService.getPublicBootstrap();
  response.json(result);
}

async function getCurrentUserController(request, response) {
  const result = await bootstrapService.getCurrentUserSnapshot(request.auth.userId);
  response.json(result);
}

module.exports = {
  getBootstrapController,
  getCurrentUserController
};

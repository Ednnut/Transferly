const express = require('express');

const {
  getBootstrapController,
  getCurrentUserController
} = require('../controllers/bootstrapController');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuthenticatedUser } = require('../middleware/authenticateRequest');

const bootstrapRouter = express.Router();
const meRouter = express.Router();

bootstrapRouter.get('/', asyncHandler(getBootstrapController));
meRouter.get('/', requireAuthenticatedUser, asyncHandler(getCurrentUserController));

module.exports = {
  bootstrapRoutes: bootstrapRouter,
  meRoutes: meRouter
};

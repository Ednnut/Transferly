const express = require('express');

const { handlePayPalWebhookController } = require('../controllers/webhookController');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/paypal', asyncHandler(handlePayPalWebhookController));

module.exports = {
  webhookRoutes: router
};

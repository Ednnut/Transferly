const express = require('express');

const { loginController, registerController } = require('../controllers/authController');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(loginController));
router.post('/register', asyncHandler(registerController));

module.exports = {
  authRoutes: router
};

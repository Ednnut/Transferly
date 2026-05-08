const compression = require('compression');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const config = require('../config');
const { assignRequestId } = require('../middleware/requestContext');
const { authenticateRequest } = require('../middleware/authenticateRequest');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const { registerRoutes } = require('../routes');

function configureHttpKernel(app) {
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(assignRequestId);
  app.use(authenticateRequest);
  app.use(
    rateLimit({
      windowMs: config.API_RATE_LIMIT_WINDOW_MS,
      max: config.API_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(
    express.json({
      limit: '1mb',
      verify(request, _response, buffer) {
        request.rawBody = buffer.toString('utf8');
      }
    })
  );

  app.get('/health', (_request, response) => {
    response.json({ ok: true });
  });

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);
}

module.exports = {
  configureHttpKernel
};

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
const { logger } = require('../utils/logger');
const { sanitizeRequestUrl } = require('../utils/sanitizeRequestUrl');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildOriginMatcher(origin) {
  if (!origin.includes('*')) {
    return { type: 'exact', value: origin };
  }

  return {
    type: 'pattern',
    value: origin,
    pattern: new RegExp(`^${escapeRegExp(origin).replace(/\\\*/g, '[^.]+')}$`)
  };
}

function buildHealthPayload(request) {
  return {
    ok: true,
    status: 'healthy',
    requestId: request.id,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    checks: {
      database: 'configured',
      queue: config.INLINE_QUEUE_MODE ? 'inline' : 'redis',
      corsOrigins: config.CORS_ALLOWED_ORIGINS.length,
      telegramMiniAppUrl: Boolean(config.TELEGRAM_MINI_APP_URL),
      telegramMiniAppAuth: Boolean(config.TELEGRAM_BOT_TOKEN)
    }
  };
}

function buildClientHealthPayload(request) {
  const telegramMiniAppConfigured = Boolean(config.TELEGRAM_MINI_APP_URL);
  const telegramAuthConfigured = Boolean(config.TELEGRAM_BOT_TOKEN);
  const nextActions = [];

  if (!telegramMiniAppConfigured) {
    nextActions.push('Configure TELEGRAM_MINI_APP_URL before launching the Mini App in production.');
  }

  if (!telegramAuthConfigured) {
    nextActions.push('Configure TELEGRAM_BOT_TOKEN so Telegram Mini App sessions can be verified.');
  }

  return {
    ok: true,
    status: nextActions.length > 0 ? 'degraded' : 'healthy',
    contractVersion: '2026-07-client-health-v1',
    requestId: request.id,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    api: {
      available: true,
      mode: config.NODE_ENV
    },
    auth: {
      telegramMiniApp: {
        enabled: telegramAuthConfigured,
        launchUrlConfigured: telegramMiniAppConfigured,
        expiresInSeconds: config.TELEGRAM_MINI_APP_AUTH_EXPIRES_IN_SECONDS
      }
    },
    cors: {
      allowedOriginCount: config.CORS_ALLOWED_ORIGINS.length
    },
    deployment: {
      frontendOriginConfigured: Boolean(config.FRONTEND_URL),
      miniAppOriginConfigured: telegramMiniAppConfigured
    },
    featureFlags: {
      telegramMiniApp: telegramMiniAppConfigured,
      providerWorkspace: true
    },
    degraded: nextActions.length > 0,
    nextActions
  };
}

function buildCorsOptions() {
  const matchers = config.CORS_ALLOWED_ORIGINS.map(buildOriginMatcher);
  const exactOrigins = new Set(matchers.filter((entry) => entry.type === 'exact').map((entry) => entry.value));
  const patternOrigins = matchers.filter((entry) => entry.type === 'pattern');

  return {
    credentials: true,
    exposedHeaders: ['x-request-id', 'retry-after'],
    allowedHeaders: [
      'authorization',
      'content-type',
      'idempotency-key',
      'x-admin-token',
      'x-request-id',
      'x-transferly-client',
      'x-api-signature',
      'x-api-timestamp',
      'x-telegram-init-data',
      'x-telegram-start-param',
      'x-telegram-bot-api-secret-token'
    ],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin(origin, callback) {
      const allowed =
        !origin ||
        exactOrigins.has(origin) ||
        patternOrigins.some((entry) => entry.pattern.test(origin));

      if (allowed) {
        callback(null, true);
        return;
      }

      logger.warn(
        {
          origin,
          configuredOrigins: config.CORS_ALLOWED_ORIGINS.length
        },
        'CORS origin rejected'
      );
      callback(null, false);
    }
  };
}

function requestLogger(request, response, next) {
  const startedAt = process.hrtime.bigint();

  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info(
      {
        requestId: request.id,
        method: request.method,
        path: sanitizeRequestUrl(request.originalUrl),
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs)
      },
      'HTTP request completed'
    );
  });

  next();
}

function configureHttpKernel(app) {
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(compression());
  app.use(assignRequestId);
  app.use(requestLogger);
  app.use(
    express.json({
      limit: '1mb',
      verify(request, _response, buffer) {
        request.rawBody = buffer.toString('utf8');
      }
    })
  );
  app.use(authenticateRequest);
  app.use(
    rateLimit({
      windowMs: config.API_RATE_LIMIT_WINDOW_MS,
      max: config.API_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (request) => request.path === '/health' || request.path === '/api/health' || request.path === '/api/health/client',
      handler: (request, response) => {
        response.status(429).json({
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          requestId: request.id
        });
      }
    })
  );
  app.get('/health', (request, response) => {
    response.json(buildHealthPayload(request));
  });

  app.get('/api/health', (request, response) => {
    response.json(buildHealthPayload(request));
  });

  app.get('/api/health/client', (request, response) => {
    response.json(buildClientHealthPayload(request));
  });

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);
}

module.exports = {
  configureHttpKernel
};

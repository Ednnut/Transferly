const { ZodError } = require('zod');

const { AppError, isAppError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { sanitizeRequestUrl } = require('../utils/sanitizeRequestUrl');

function notFoundHandler(request, response) {
  response.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${sanitizeRequestUrl(request.originalUrl)} not found.`,
    requestId: request.id
  });
}

function errorHandler(error, request, response, _next) {
  if (isAppError(error)) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details,
      requestId: request.id
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: error.flatten(),
      requestId: request.id
    });
    return;
  }

  logger.error(
    {
      err: error,
      requestId: request.id,
      route: sanitizeRequestUrl(request.originalUrl)
    },
    'Unhandled request error'
  );

  const internalError = new AppError(500, 'INTERNAL_ERROR', 'Internal server error.');
  response.status(internalError.statusCode).json({
    code: internalError.code,
    message: internalError.message,
    requestId: request.id
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};

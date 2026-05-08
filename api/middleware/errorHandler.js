const { ZodError } = require('zod');

const { AppError, isAppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

function notFoundHandler(request, response) {
  response.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${request.originalUrl} not found.`
  });
}

function errorHandler(error, request, response, _next) {
  if (isAppError(error)) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: error.flatten()
    });
    return;
  }

  logger.error(
    {
      err: error,
      requestId: request.id,
      route: request.originalUrl
    },
    'Unhandled request error'
  );

  const internalError = new AppError(500, 'INTERNAL_ERROR', 'Internal server error.');
  response.status(internalError.statusCode).json({
    code: internalError.code,
    message: internalError.message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};

/**
 * layer: baseplate
 * purpose: Unified Exception Handler — catches ApiException / BuilderException
 *          style SDK errors and normalizes them into structured JSON errors.
 * sdk: globalpayments-api (ApiError, BuilderError, GatewayError via error names)
 */
'use strict';

/**
 * Express error-handling middleware. Mounted last by the Baseplate.
 * Normalizes every error to: { error: { type, message, status } }
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const type = err.name || 'Error';
  const isSdkError = /ApiError|GatewayError|BuilderError|ConfigurationError/.test(type);
  const status = isSdkError ? 502 : err.statusCode || 500;

  res.status(status).json({
    error: {
      type,
      message: err.message || 'Unexpected error',
      status,
    },
  });
}

module.exports = { errorHandler };

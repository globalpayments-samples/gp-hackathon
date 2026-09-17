addRoute('POST', '/api/payments/verify', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').verifyToken(body);
});

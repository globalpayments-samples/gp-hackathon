addRoute('POST', '/api/payments/status', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').paymentStatus(body);
});

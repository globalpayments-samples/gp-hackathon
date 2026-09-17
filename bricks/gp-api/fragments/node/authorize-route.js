addRoute('POST', '/api/payments/authorize', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').authorizePayment(body);
});

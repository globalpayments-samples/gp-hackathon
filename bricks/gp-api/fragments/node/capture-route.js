addRoute('POST', '/api/payments/capture', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').capturePayment(body);
});

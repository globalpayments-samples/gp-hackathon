addRoute('POST', '/api/payments/reverse', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').reversePayment(body);
});

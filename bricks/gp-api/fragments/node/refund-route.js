addRoute('POST', '/api/payments/refund', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').refundPayment(body);
});

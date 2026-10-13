addRoute('POST', '/api/payments/cancel', ({ body, requireAccessCredentials }) => {
  requireAccessCredentials();
  return require('./bricks/access/node/payment').cancelPayment(body);
});

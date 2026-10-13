addRoute('POST', '/api/payments', ({ body, requireAccessCredentials }) => {
  requireAccessCredentials();
  return require('./bricks/access/node/payment').authorizeCheckoutPayment(body);
});

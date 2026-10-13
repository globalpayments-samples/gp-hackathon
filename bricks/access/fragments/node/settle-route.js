addRoute('POST', '/api/payments/settle', ({ body, requireAccessCredentials }) => {
  requireAccessCredentials();
  return require('./bricks/access/node/payment').settlePayment(body);
});

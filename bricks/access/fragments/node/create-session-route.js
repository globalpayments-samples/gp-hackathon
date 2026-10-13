addRoute('POST', '/api/checkout-sessions', ({ body, requireAccessCredentials }) => {
  requireAccessCredentials();
  return require('./bricks/access/node/checkout-session').createCheckoutSession(body);
});

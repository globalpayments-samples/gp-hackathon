addRoute('GET', '/api/payments', ({ url, requireAccessCredentials }) => {
  requireAccessCredentials();
  return require('./bricks/access/node/payment').queryPayment(url.searchParams.get('reference'));
});

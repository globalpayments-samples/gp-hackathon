addRoute('POST', '/api/payments/charge-with-exemption', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/sca-exemption').chargeWithExemption(body);
});

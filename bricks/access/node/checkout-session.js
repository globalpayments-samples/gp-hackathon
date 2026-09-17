'use strict';

const { CHECKOUT_MEDIA_TYPE, accessRequest, configuredBaseUrl, requireString } = require('./access-client');

function createCheckoutSession({ reference, amount, currency = 'GBP', returnUrl }) {
  const url = new URL('/checkout-sessions', configuredBaseUrl());
  return accessRequest(url, 'POST', {
    transactionReference: requireString(reference, 'reference'),
    paymentAmount: {
      value: requireString(amount, 'amount'),
      currency,
    },
    returnUrl: requireString(returnUrl, 'returnUrl'),
  }, CHECKOUT_MEDIA_TYPE);
}

module.exports = { createCheckoutSession };

'use strict';

const { ACCESS_MEDIA_TYPE, CHECKOUT_MEDIA_TYPE, accessRequest, configuredBaseUrl, requireString, trustedHalUrl } = require('./access-client');

function authorizeCheckoutPayment({ checkoutSessionUrl, token }) {
  return accessRequest(trustedHalUrl(checkoutSessionUrl), 'POST', {
    paymentInstrument: {
      type: 'card/tokenized',
      token: requireString(token, 'token'),
    },
  }, CHECKOUT_MEDIA_TYPE);
}

function settlePayment({ links, payload = {} }) {
  return accessRequest(trustedHalUrl(links?.settle?.href), 'POST', payload, ACCESS_MEDIA_TYPE);
}

function cancelPayment({ links, payload = {} }) {
  return accessRequest(trustedHalUrl(links?.cancel?.href), 'POST', payload, ACCESS_MEDIA_TYPE);
}

function queryPayment(reference) {
  const url = new URL('/payments', configuredBaseUrl());
  url.searchParams.set('transactionReference', requireString(reference, 'reference'));
  return accessRequest(url, 'GET', undefined, ACCESS_MEDIA_TYPE);
}

module.exports = { authorizeCheckoutPayment, cancelPayment, queryPayment, settlePayment };

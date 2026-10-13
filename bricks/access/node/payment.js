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

// Built server-side from the payment id; the browser never supplies the URL or body.
function paymentActionUrl(paymentId, action) {
  const id = requireString(paymentId, 'paymentId');
  if (!/^[A-Za-z0-9._~-]+$/.test(id) || id === '.' || id === '..') {
    throw Object.assign(new Error('paymentId is invalid'), { status: 400 });
  }
  return new URL(`/api/payments/${id}/${action}`, configuredBaseUrl());
}

function settlePayment({ paymentId }) {
  return accessRequest(paymentActionUrl(paymentId, 'settlements'), 'POST', undefined, ACCESS_MEDIA_TYPE);
}

function cancelPayment({ paymentId }) {
  return accessRequest(paymentActionUrl(paymentId, 'cancellations'), 'POST', undefined, ACCESS_MEDIA_TYPE);
}

function queryPayment(reference) {
  const url = new URL('/payments', configuredBaseUrl());
  url.searchParams.set('transactionReference', requireString(reference, 'reference'));
  return accessRequest(url, 'GET', undefined, ACCESS_MEDIA_TYPE);
}

module.exports = { authorizeCheckoutPayment, cancelPayment, paymentActionUrl, queryPayment, settlePayment };

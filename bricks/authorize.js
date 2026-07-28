/**
 * layer: brick
 * purpose: Authorize — places a hold on funds without capturing them.
 * sdk: globalpayments-api (CreditCardData)
 */
'use strict';

const { CreditCardData } = require('globalpayments-api');

async function authorize({ token, amount, currency = 'USD' }) {
  const card = new CreditCardData();
  card.token = token;
  const transaction = await card.authorize(amount).withCurrency(currency).execute();
  return {
    transactionId: transaction.transactionId,
    status: transaction.transactionStatus || transaction.responseMessage,
    responseCode: transaction.responseCode,
    authorizationCode: transaction.authorizationCode || null,
  };
}

module.exports = { authorize };

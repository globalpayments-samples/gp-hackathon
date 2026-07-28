/**
 * layer: brick
 * purpose: Charge — single-step authorization and capture of a tokenized card.
 * sdk: globalpayments-api (CreditCardData)
 */
'use strict';

const { CreditCardData } = require('globalpayments-api');

async function charge({ token, amount, currency = 'USD' }) {
  const card = new CreditCardData();
  card.token = token;
  const transaction = await card.charge(amount).withCurrency(currency).execute();
  return {
    transactionId: transaction.transactionId,
    status: transaction.transactionStatus || transaction.responseMessage,
    responseCode: transaction.responseCode,
    authorizationCode: transaction.authorizationCode || null,
  };
}

module.exports = { charge };

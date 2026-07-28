/**
 * layer: brick
 * purpose: Capture — settles a previously authorized transaction by id.
 * sdk: globalpayments-api (Transaction)
 */
'use strict';

const { Transaction } = require('globalpayments-api');

async function capture({ transactionId, amount, currency = 'USD' }) {
  const builder = Transaction.fromId(transactionId).capture(amount);
  if (currency) builder.withCurrency(currency);
  const transaction = await builder.execute();
  return {
    transactionId: transaction.transactionId,
    status: transaction.transactionStatus || transaction.responseMessage,
    responseCode: transaction.responseCode,
    authorizationCode: transaction.authorizationCode || null,
  };
}

module.exports = { capture };

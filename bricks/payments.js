/**
 * layer: brick
 * purpose: Atomic SDK payment operations — Charge (single-step auth+capture),
 *          Authorize (hold funds), Capture (settle a prior authorization).
 *          Isolated, stateless functions with predictable inputs and outputs.
 * sdk: globalpayments-api (CreditCardData, Transaction)
 */
'use strict';

const { CreditCardData, Transaction } = require('globalpayments-api');

function summarize(transaction) {
  return {
    transactionId: transaction.transactionId,
    status: transaction.transactionStatus || transaction.responseMessage,
    responseCode: transaction.responseCode,
    authorizationCode: transaction.authorizationCode || null,
  };
}

function cardFromToken(token) {
  const card = new CreditCardData();
  card.token = token;
  return card;
}

/** Single-step authorization and capture of a tokenized card. */
async function charge({ token, amount, currency = 'USD' }) {
  const transaction = await cardFromToken(token)
    .charge(amount)
    .withCurrency(currency)
    .execute();
  return summarize(transaction);
}

/** Places a hold on funds without capturing them. */
async function authorize({ token, amount, currency = 'USD' }) {
  const transaction = await cardFromToken(token)
    .authorize(amount)
    .withCurrency(currency)
    .execute();
  return summarize(transaction);
}

/** Captures a previously authorized transaction by id. */
async function capture({ transactionId, amount, currency = 'USD' }) {
  const builder = Transaction.fromId(transactionId).capture(amount);
  if (currency) {
    builder.withCurrency(currency);
  }
  const transaction = await builder.execute();
  return summarize(transaction);
}

module.exports = { charge, authorize, capture };

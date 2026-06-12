'use strict';

const { CreditCardData } = require('globalpayments-api');

/**
 * Shared sandbox fixtures for component tests.
 * Tokenizes the documented Global Payments sandbox Visa so brick tests can
 * exercise the same token-based entry points the generated app uses.
 */
async function sandboxCardToken() {
  const card = new CreditCardData();
  card.number = '4263970000005262';
  card.expMonth = '12';
  card.expYear = '2030';
  card.cvn = '123';
  card.cardHolderName = 'Lego Tester';

  const response = await card.tokenize().execute();
  return response.token;
}

module.exports = { sandboxCardToken };

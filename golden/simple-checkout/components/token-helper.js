/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 * sdk: globalpayments-api (GpApiService.generateTransactionKey)
 */
'use strict';

const { GpApiConfig, GpApiService } = require('globalpayments-api');

/**
 * Generates a short-lived access token for client-side tokenization.
 * The browser token is restricted to single-use payment-method creation
 * (PMT_POST_Create_Single) — GP API rejects hosted-fields tokenization
 * performed with a full-permission token.
 * @param {import('globalpayments-api').GpApiConfig} config registered GP-API config
 * @returns {Promise<{ accessToken: string }>}
 */
async function generateAccessToken(config) {
  const restricted = new GpApiConfig();
  restricted.appId = config.appId;
  restricted.appKey = config.appKey;
  restricted.environment = config.environment;
  restricted.country = config.country;
  restricted.permissions = ['PMT_POST_Create_Single'];

  const response = await GpApiService.generateTransactionKey(restricted);
  return { accessToken: response.accessToken || response.token };
}

module.exports = { generateAccessToken };

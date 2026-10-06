'use strict';

const {
  AccessTokenInfo,
  Channel,
  CreditCardData,
  Environment,
  ExemptStatus,
  GpApiConfig,
  ServicesContainer,
  ThreeDSecure,
} = require('globalpayments-api');

// Exemptions that can be requested in the authorization message alone, with
// no 3D Secure authentication first. The issuer decides whether to apply it.
const EXEMPTIONS = {
  'low-value': ExemptStatus.LowValue,
  'transaction-risk-analysis': ExemptStatus.TransactionRiskAnalysis,
  'trusted-merchant': ExemptStatus.TrustedMerchant,
  'secure-corporate-payment': ExemptStatus.SecureCorporatePayment,
};

function configureGpApi() {
  const config = new GpApiConfig();
  config.appId = process.env.GP_APP_ID;
  config.appKey = process.env.GP_APP_KEY;
  config.environment = String(process.env.GP_API_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
    ? Environment.Production
    : Environment.Test;
  config.channel = Channel.CardNotPresent;
  config.country = process.env.GP_COUNTRY;
  config.accessTokenInfo = new AccessTokenInfo();
  ServicesContainer.configureService(config);
}

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${name} is required`), { status: 400 });
  }
  return value.trim();
}

function exemptionFromBody(body) {
  const name = requireString(body.exemption, 'exemption');
  if (!Object.prototype.hasOwnProperty.call(EXEMPTIONS, name)) {
    throw Object.assign(
      new Error(`exemption must be one of: ${Object.keys(EXEMPTIONS).join(', ')}`),
      { status: 400 }
    );
  }
  return EXEMPTIONS[name];
}

function serialize(response, exemption) {
  return {
    transactionId: response.transactionId,
    responseCode: response.responseCode,
    responseMessage: response.responseMessage,
    authorizationCode: response.authorizationCode,
    exemptionRequested: exemption,
  };
}

async function chargeWithExemption(body) {
  const exemption = exemptionFromBody(body);
  configureGpApi();
  const card = new CreditCardData();
  card.token = requireString(body.token, 'token');
  card.threeDSecure = new ThreeDSecure();
  card.threeDSecure.exemptStatus = exemption;
  return serialize(await card
    .charge(body.amount || '10.00')
    .withCurrency(body.currency || 'EUR')
    .execute(), exemption);
}

module.exports = {
  EXEMPTIONS,
  chargeWithExemption,
};

'use strict';

const {
  AccessTokenInfo,
  Channel,
  CreditCardData,
  Environment,
  GpApiConfig,
  ReportingService,
  ServicesContainer,
  Transaction,
} = require('globalpayments-api');

function configureGpApi() {
  const config = new GpApiConfig();
  config.appId = process.env.GP_APP_ID;
  config.appKey = process.env.GP_APP_KEY;
  config.environment = String(process.env.GP_API_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
    ? Environment.Production
    : Environment.Test;
  config.channel = Channel.CardNotPresent;
  config.country = process.env.GP_COUNTRY || 'US';
  config.accessTokenInfo = new AccessTokenInfo();
  ServicesContainer.configureService(config);
}

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${name} is required`), { status: 400 });
  }
  return value.trim();
}

function cardFromBody(body) {
  const card = new CreditCardData();
  card.token = requireString(body.token, 'token');
  return card;
}

function transactionFromBody(body) {
  return Transaction.fromId(requireString(body.transactionId, 'transactionId'));
}

function serialize(response) {
  return {
    transactionId: response.transactionId,
    responseCode: response.responseCode,
    responseMessage: response.responseMessage,
    authorizationCode: response.authorizationCode,
  };
}

async function verifyToken(body) {
  configureGpApi();
  return serialize(await cardFromBody(body).verify().withCurrency(body.currency || 'USD').execute());
}

async function authorizePayment(body) {
  configureGpApi();
  return serialize(await cardFromBody(body)
    .authorize(body.amount || '29.99')
    .withCurrency(body.currency || 'USD')
    .execute());
}

async function capturePayment(body) {
  configureGpApi();
  return serialize(await transactionFromBody(body).capture(body.amount || undefined).execute());
}

async function refundPayment(body) {
  configureGpApi();
  return serialize(await transactionFromBody(body).refund(body.amount || undefined).execute());
}

async function reversePayment(body) {
  configureGpApi();
  return serialize(await transactionFromBody(body).reverse(body.amount || undefined).execute());
}

async function paymentStatus(body) {
  configureGpApi();
  return serialize(await ReportingService.transactionDetail(requireString(body.transactionId, 'transactionId')).execute());
}

module.exports = {
  authorizePayment,
  capturePayment,
  paymentStatus,
  refundPayment,
  reversePayment,
  verifyToken,
};

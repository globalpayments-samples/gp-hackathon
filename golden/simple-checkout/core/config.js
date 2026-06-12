/**
 * layer: baseplate
 * purpose: Configuration Manager — parses env configuration and initializes the
 *          unified GP-API ServicesConfig (App ID, App Key, environment, account).
 * sdk: globalpayments-api (GpApiConfig, ServicesContainer, Channel, Environment)
 */
'use strict';

require('dotenv').config();

const {
  Channel,
  Environment,
  GpApiConfig,
  ServicesContainer,
} = require('globalpayments-api');

const REQUIRED_VARS = ['GP_APP_ID', 'GP_APP_KEY'];

function missingVars() {
  return REQUIRED_VARS.filter((name) => !process.env[name]);
}

/**
 * Builds the unified GpApiConfig from environment variables and registers it
 * with the SDK ServicesContainer. Returns the config for further use.
 */
function loadConfig() {
  const missing = missingVars();
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your sandbox credentials.'
    );
  }

  const config = new GpApiConfig();
  config.appId = process.env.GP_APP_ID;
  config.appKey = process.env.GP_APP_KEY;
  config.channel = Channel.CardNotPresent;
  config.environment =
    (process.env.GP_API_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
      ? Environment.Production
      : Environment.Test;
  config.country = process.env.GP_COUNTRY || 'US';
  if (process.env.GP_MERCHANT_ID) {
    config.merchantId = process.env.GP_MERCHANT_ID;
  }
  if (process.env.GP_ACCOUNT_NAME) {
    config.transactionProcessingAccountName = process.env.GP_ACCOUNT_NAME;
  }

  ServicesContainer.configureService(config);
  return config;
}

module.exports = { loadConfig, missingVars, REQUIRED_VARS };

'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const { config } = require('dotenv');

config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const required = [
  'TAPI_API_KEY',
  'TAPI_API_SECRET',
  'TAPI_ACCOUNT_CREDENTIAL',
  'TAPI_REGION',
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing TAPI configuration: ${missing.join(', ')}`);
  process.exit(2);
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const header = encode({ alg: 'HS256', typ: 'JWT' });
const payload = encode({
  type: 'AuthTokenV2',
  region: process.env.TAPI_REGION,
  account_credential: process.env.TAPI_ACCOUNT_CREDENTIAL,
  ts: Date.now(),
});
const signature = crypto
  .createHmac('sha256', process.env.TAPI_API_SECRET)
  .update(`${header}.${payload}`)
  .digest('base64url');
const token = `${header}.${payload}.${signature}`;
const baseUrl = process.env.TAPI_BASE_URL || 'https://api.pit.paygateway.com/transactions/';
const url = new URL(`creditsales/${crypto.randomUUID()}`, baseUrl);

async function main() {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `AuthToken ${token}`,
      'X-GP-Api-Key': process.env.TAPI_API_KEY,
      'X-GP-Version': process.env.TAPI_API_VERSION || '2021-04-08',
      'X-GP-Partner-App-Name': process.env.TAPI_PARTNER_NAME || 'gp_hackathon',
      'X-GP-Request-Id': `MER-${crypto.randomUUID()}`,
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = {};
  }

  const result = {
    status: response.status,
    errorCode: body.error_code ?? body.error?.code ?? null,
    detailedErrorCode: body.detailed_error_code ?? null,
  };

  if (response.status === 401 || response.status === 403) {
    throw new Error(`TAPI authentication failed: ${JSON.stringify(result)}`);
  }
  if (response.status >= 500) {
    throw new Error(`TAPI service error: ${JSON.stringify(result)}`);
  }

  console.log(`TAPI credentials authenticated: ${JSON.stringify(result)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

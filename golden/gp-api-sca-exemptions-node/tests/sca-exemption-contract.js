'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/sca-exemption.json');
const { routes, missingCredentials } = require('../index');
const { EXEMPTIONS, chargeWithExemption } = require('../bricks/gp-api/node/sca-exemption');

test('GP API exposes the exemption charge route', () => {
  assert.ok(Object.keys(routes).includes('POST /api/payments/charge-with-exemption'));
  assert.ok(!Object.keys(routes).some((route) => route.includes(':') || route.includes('operation')));
});

test('GP API exemption route needs a country as well as credentials', () => {
  const original = process.env;
  process.env = {};
  assert.ok(missingCredentials().includes('GP_COUNTRY'));
  process.env = original;
});

test('Only authorization-message exemptions are offered', () => {
  assert.deepEqual(Object.keys(EXEMPTIONS).sort(), [
    'low-value',
    'secure-corporate-payment',
    'transaction-risk-analysis',
    'trusted-merchant',
  ]);
});

test('Unknown exemptions are rejected before any gateway call', async () => {
  await assert.rejects(chargeWithExemption({ ...fixture.exemptCharge, exemption: 'sca-delegation' }), { status: 400 });
  await assert.rejects(chargeWithExemption({ ...fixture.exemptCharge, exemption: undefined }), { status: 400 });
});

test('Each exemption reaches the authorization request as exempt_status', async (t) => {
  // No network: answer the SDK's token and transaction calls locally and keep
  // the request bodies it would have sent.
  const https = require('node:https');
  const { EventEmitter } = require('node:events');
  const original = https.request;
  const savedEnv = process.env;
  const sent = [];
  https.request = (options, callback) => {
    const req = new EventEmitter();
    let body = '';
    req.write = (chunk) => { body += chunk; };
    req.setTimeout = () => req;
    req.end = (chunk) => {
      if (chunk) body += chunk;
      const path = options.path || '';
      sent.push({ path, body: body ? JSON.parse(body) : null });
      const payload = path.includes('accesstoken')
        ? { token: 'fixture', type: 'Bearer', seconds_to_expire: 900, scope: { accounts: [{ id: 'TRA_fixture', name: 'transaction_processing' }] } }
        : { id: 'TRN_fixture', status: 'CAPTURED', action: { result_code: 'SUCCESS' }, payment_method: { result: '00', card: { authcode: '123456' } } };
      const res = new EventEmitter();
      res.statusCode = 200;
      res.headers = {};
      res.setEncoding = () => {};
      callback(res);
      process.nextTick(() => { res.emit('data', JSON.stringify(payload)); res.emit('end'); });
    };
    return req;
  };
  process.env = { GP_APP_ID: 'fixture', GP_APP_KEY: 'fixture', GP_API_ENVIRONMENT: 'sandbox', GP_COUNTRY: 'IE' };
  t.after(() => { https.request = original; process.env = savedEnv; });

  const expected = {
    'low-value': 'LOW_VALUE',
    'transaction-risk-analysis': 'TRANSACTION_RISK_ANALYSIS',
    'trusted-merchant': 'TRUSTED_MERCHANT',
    'secure-corporate-payment': 'SECURE_CORPORATE_PAYMENT',
  };
  for (const [name, status] of Object.entries(expected)) {
    sent.length = 0;
    const result = await chargeWithExemption({ ...fixture.exemptCharge, exemption: name });
    const charge = sent.find((s) => s.path.endsWith('/transactions'));
    assert.ok(charge, `no transaction request for ${name}`);
    assert.equal(charge.body.type, 'SALE');
    assert.equal(charge.body.currency, 'EUR');
    assert.equal(charge.body.country, 'IE');
    assert.equal(charge.body.payment_method.authentication.three_ds.exempt_status, status);
    assert.equal(result.exemptionRequested, status);
    assert.equal(result.responseCode, 'SUCCESS');
  }
});

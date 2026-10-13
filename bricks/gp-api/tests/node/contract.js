'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/lifecycle.json');
const { routes, missingCredentials } = require('../index');

test('GP API exposes fixed lifecycle routes only', () => {
  assert.deepEqual(Object.keys(routes).sort(), [
    'POST /api/payments/authorize',
    'POST /api/payments/capture',
    'POST /api/payments/refund',
    'POST /api/payments/reverse',
    'POST /api/payments/status',
    'POST /api/payments/verify',
  ]);
  assert.ok(!Object.keys(routes).some((route) => route.includes(':') || route.includes('operation')));
});

test('GP API live routes are credential gated', () => {
  const original = process.env;
  process.env = {};
  assert.deepEqual(missingCredentials(), ['GP_API_ENVIRONMENT', 'GP_APP_ID', 'GP_APP_KEY']);
  process.env = original;
});

test('GP API deterministic fixture documents token and follow-up shapes', () => {
  assert.equal(fixture.tokenPayment.token, 'single-use-token-from-hosted-fields');
  assert.equal(fixture.followUp.transactionId, 'TRN_fixture_authorization');
});

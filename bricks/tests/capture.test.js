'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { missingVars } = require('../core/config');
const { sandboxCardToken } = require('./fixtures/sandbox');

const missing = missingVars();
const skip = missing.length > 0
  ? `skipped: set ${missing.join(', ')} in .env to run sandbox tests`
  : false;

test('capture brick settles a prior sandbox authorization', { skip }, async () => {
  const { loadConfig } = require('../core/config');
  const { authorize, capture } = require('../components/payments');

  loadConfig();
  const token = await sandboxCardToken();
  const held = await authorize({ token, amount: '34.99', currency: 'USD' });
  assert.equal(held.status, 'PREAUTHORIZED');

  const result = await capture({
    transactionId: held.transactionId,
    amount: '34.99',
    currency: 'USD',
  });

  assert.equal(result.responseCode, 'SUCCESS');
  assert.equal(result.status, 'CAPTURED');
});

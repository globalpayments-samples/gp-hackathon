'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { missingVars } = require('../core/config');
const { sandboxCardToken } = require('./fixtures/sandbox');

const missing = missingVars();
const skip = missing.length > 0
  ? `skipped: set ${missing.join(', ')} in .env to run sandbox tests`
  : false;

test('charge brick executes a single-step sandbox sale', { skip }, async () => {
  const { loadConfig } = require('../core/config');
  const { charge } = require('../components/charge');

  loadConfig();
  const token = await sandboxCardToken();
  const result = await charge({ token, amount: '14.99', currency: 'USD' });

  assert.equal(result.responseCode, 'SUCCESS');
  assert.equal(result.status, 'CAPTURED');
  assert.ok(result.transactionId);
});

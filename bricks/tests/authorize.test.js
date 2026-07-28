'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { missingVars } = require('../core/config');
const { sandboxCardToken } = require('./fixtures/sandbox');

const missing = missingVars();
const skip = missing.length > 0
  ? `skipped: set ${missing.join(', ')} in .env to run sandbox tests`
  : false;

test('authorize brick places a sandbox hold without capturing', { skip }, async () => {
  const { loadConfig } = require('../core/config');
  const { authorize } = require('../components/authorize');

  loadConfig();
  const token = await sandboxCardToken();
  const result = await authorize({ token, amount: '24.99', currency: 'USD' });

  assert.equal(result.responseCode, 'SUCCESS');
  assert.equal(result.status, 'PREAUTHORIZED');
  assert.ok(result.transactionId);
});

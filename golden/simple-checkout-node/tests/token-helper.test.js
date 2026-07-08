'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { missingVars } = require('../core/config');

const missing = missingVars();
const skip = missing.length > 0
  ? `skipped: set ${missing.join(', ')} in .env to run sandbox tests`
  : false;

test('token-helper stud mints a Hosted Fields access token', { skip }, async () => {
  const { loadConfig } = require('../core/config');
  const { generateAccessToken } = require('../components/token-helper');

  const config = loadConfig();
  const { accessToken } = await generateAccessToken(config);

  assert.ok(typeof accessToken === 'string' && accessToken.length > 0);
});

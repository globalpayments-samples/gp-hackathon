'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('hosted-fields tile assets are wired into the generated project', () => {
  const asset = path.join(root, 'public', 'components', 'hosted-fields.js');
  assert.ok(fs.existsSync(asset), 'public/components/hosted-fields.js is vendored');

  const page = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
  for (const target of ['gp-card-number', 'gp-card-expiration', 'gp-card-cvv', 'gp-card-holder', 'gp-card-submit']) {
    assert.match(page, new RegExp(`id="${target}"`), `checkout page mounts the ${target} secure field`);
  }
  assert.match(page, /js\.globalpay\.com/, 'checkout page loads the GP js library');
});

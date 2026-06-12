'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { missingVars } = require('../core/config');

const missing = missingVars();
const skip = missing.length > 0
  ? `skipped: set ${missing.join(', ')} in .env to run sandbox tests`
  : false;

test('generated project boots and serves the branded checkout', { skip }, async () => {
  const app = require('../index');
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });

    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /gp-logo\.png/, 'header carries the Global Payments logo');

    const logo = await fetch(`http://127.0.0.1:${port}/gp-logo.png`);
    assert.equal(logo.status, 200, 'logo asset is served');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

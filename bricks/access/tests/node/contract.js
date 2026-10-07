'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/checkout.json');
const { routes, rawRoutes, missingCredentials } = require('../index');
const { trustedHalUrl } = require('../bricks/access/node/access-client');
const { paymentActionUrl } = require('../bricks/access/node/payment');
const { verifyAccessWebhook } = require('../studs/common/access/node/webhook-verifier');

test('Access exposes fixed routes and webhook boundary', () => {
  assert.deepEqual(Object.keys(routes).sort(), [
    'GET /api/payments',
    'POST /api/checkout-sessions',
    'POST /api/payments',
    'POST /api/payments/cancel',
    'POST /api/payments/settle',
  ]);
  assert.deepEqual(Object.keys(rawRoutes), ['POST /webhooks/events']);
});

test('Access HAL links are constrained to configured origin and path', () => {
  const original = process.env.ACCESS_BASE_URL;
  process.env.ACCESS_BASE_URL = 'https://try.access.worldpay.com';
  assert.equal(trustedHalUrl('/payments/abc').origin, 'https://try.access.worldpay.com');
  assert.throws(() => trustedHalUrl('https://example.invalid/payments/abc'), /origin\/path/);
  assert.throws(() => trustedHalUrl('https://try.access.worldpay.com/admin'), /origin\/path/);
  assert.throws(() => trustedHalUrl('/paymentsX/abc'), /origin\/path/);
  process.env.ACCESS_BASE_URL = original;
});

test('Access settle/cancel URLs are built server-side from the payment id', () => {
  const original = process.env.ACCESS_BASE_URL;
  process.env.ACCESS_BASE_URL = 'https://try.access.worldpay.com';
  assert.equal(
    paymentActionUrl(fixture.paymentId, 'settlements').href,
    'https://try.access.worldpay.com/api/payments/fixture-payment-1/settlements',
  );
  for (const bad of ['../admin', 'a/b', '..', 'a?x=1', '']) {
    assert.throws(() => paymentActionUrl(bad, 'cancellations'), /paymentId/);
  }
  process.env.ACCESS_BASE_URL = original;
});

test('Access live calls and webhooks are credential gated', () => {
  const originalEnv = process.env;
  process.env = {};
  assert.deepEqual(missingCredentials(), ['ACCESS_BASE_URL', 'ACCESS_MERCHANT_CODE', 'ACCESS_MERCHANT_KEY', 'ACCESS_WEBHOOK_SECRET']);
  assert.throws(() => verifyAccessWebhook(Buffer.from('{}'), 'bad'), /not configured/);
  process.env = { ACCESS_WEBHOOK_SECRET: 'secret' };
  assert.throws(() => verifyAccessWebhook(Buffer.from('{}'), 'bad'), /Invalid webhook signature/);
  process.env = originalEnv;
});

test('Access deterministic fixture documents Checkout and payment action shapes', () => {
  assert.equal(fixture.checkoutSession.currency, 'GBP');
  assert.equal(fixture.paymentId, 'fixture-payment-1');
});

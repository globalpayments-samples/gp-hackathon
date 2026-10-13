'use strict';

const crypto = require('node:crypto');

function verifyAccessWebhook(rawBody, signature) {
  const secret = process.env.ACCESS_WEBHOOK_SECRET;
  if (!secret) {
    throw Object.assign(new Error('Webhook verification is not configured'), { status: 503 });
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = String(signature || '').replace(/^sha256=/, '');
  if (received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    throw Object.assign(new Error('Invalid webhook signature'), { status: 401 });
  }
}

module.exports = { verifyAccessWebhook };

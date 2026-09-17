addRawRoute('POST', '/webhooks/events', ({ rawBody, headers }) => {
  require('./studs/common/access/node/webhook-verifier').verifyAccessWebhook(rawBody, headers['x-wp-signature']);
});

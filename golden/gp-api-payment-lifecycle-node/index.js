'use strict';

require('dotenv').config();
const http = require('node:http');
const { readJson, respond, serveStatic } = require('./baseplate/http');

const configRequired = ["GP_API_ENVIRONMENT","GP_APP_ID","GP_APP_KEY"];
const routes = new Map();

function missingCredentials() {
  return configRequired.filter((name) => !process.env[name]);
}

function requireLiveCredentials() {
  const missing = missingCredentials();
  if (missing.length > 0) {
    throw Object.assign(new Error('Live call blocked: missing ' + missing.join(', ')), { status: 503 });
  }
}

function addRoute(method, pathname, handler) {
  const key = `${method} ${pathname}`;
  if (routes.has(key)) throw new Error(`Duplicate route registered: ${key}`);
  routes.set(key, handler);
}

addRoute('POST', '/api/payments/authorize', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').authorizePayment(body);
});

addRoute('POST', '/api/payments/capture', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').capturePayment(body);
});

addRoute('POST', '/api/payments/refund', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').refundPayment(body);
});

addRoute('POST', '/api/payments/reverse', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').reversePayment(body);
});

addRoute('POST', '/api/payments/status', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').paymentStatus(body);
});

addRoute('POST', '/api/payments/verify', ({ body, requireLiveCredentials }) => {
  requireLiveCredentials();
  return require('./bricks/gp-api/node/payment-lifecycle').verifyToken(body);
});

function app(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/health') {
    return respond(res, 200, { status: 'ok', platform: 'gp-api' });
  }
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname.startsWith('/public/') || url.pathname.startsWith('/tiles/'))) {
    return serveStatic(res, url);
  }
  const handler = routes.get(`${req.method} ${url.pathname}`);
  if (!handler) return respond(res, 404, { error: { message: 'Route not found' } });
  return readJson(req)
    .then((body) => handler({ body, url, requireLiveCredentials }))
    .then((payload) => respond(res, 200, payload))
    .catch((error) => respond(res, error.status || 502, { error: { message: error.message, details: error.details } }));
}

if (require.main === module) {
  http.createServer(app).listen(process.env.PORT || 3000);
}

module.exports = { app, routes: Object.fromEntries(routes), missingCredentials, configRequired };

'use strict';

require('dotenv').config();
const http = require('node:http');
const { readJson, readRaw, respond, servePublic } = require('./baseplate/http');

const configRequired = ["ACCESS_BASE_URL","ACCESS_MERCHANT_CODE","ACCESS_MERCHANT_KEY","ACCESS_WEBHOOK_SECRET"];
const routes = new Map();
const rawRoutes = new Map();

function missingCredentials() {
  return configRequired.filter((name) => !process.env[name]);
}

function requireAccessCredentials() {
  const missing = missingCredentials().filter((name) => name !== 'ACCESS_WEBHOOK_SECRET');
  if (missing.length > 0) {
    throw Object.assign(new Error('Live call blocked: missing ' + missing.join(', ')), { status: 503 });
  }
}

function addRoute(method, pathname, handler) {
  const key = `${method} ${pathname}`;
  if (routes.has(key)) throw new Error(`Duplicate route registered: ${key}`);
  routes.set(key, handler);
}

function addRawRoute(method, pathname, handler) {
  const key = `${method} ${pathname}`;
  if (rawRoutes.has(key)) throw new Error(`Duplicate route registered: ${key}`);
  rawRoutes.set(key, handler);
}

function app(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/health') {
    return respond(res, 200, { status: 'ok', platform: 'access' });
  }
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname.startsWith('/public/') || url.pathname.startsWith('/tiles/'))) {
    return servePublic(req, res, url);
  }
  const rawHandler = rawRoutes.get(`${req.method} ${url.pathname}`);
  if (rawHandler) {
    return readRaw(req)
      .then((rawBody) => rawHandler({ rawBody, headers: req.headers, url }))
      .then((payload) => respond(res, payload === undefined ? 204 : 200, payload))
      .catch((error) => respond(res, error.status || 502, { error: { message: error.message, details: error.details } }));
  }
  const handler = routes.get(`${req.method} ${url.pathname}`);
  if (!handler) return respond(res, 404, { error: { message: 'Route not found' } });
  return readJson(req)
    .then((body) => handler({ body, url, requireAccessCredentials }))
    .then((payload) => respond(res, 200, payload))
    .catch((error) => respond(res, error.status || 502, { error: { message: error.message, details: error.details } }));
}

if (require.main === module) {
  http.createServer(app).listen(process.env.PORT || 3000);
}

module.exports = { app, routes: Object.fromEntries(routes), rawRoutes: Object.fromEntries(rawRoutes), missingCredentials, configRequired };

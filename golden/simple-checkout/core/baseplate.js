/**
 * layer: baseplate
 * purpose: Environment Shell — minimal Express wrapper exposing initialize(),
 *          which returns a configured app with static assets, JSON parsing,
 *          a health check, and the unified error handler mounted.
 * sdk: none directly (hosts components that call the Global Payments SDK)
 */
'use strict';

const path = require('path');
const express = require('express');

const { errorHandler } = require('./error-handler');

/**
 * Creates the shared server shell every generated sample project stands on.
 * Components plug routes into the returned app; the error handler is attached
 * by finalize() after all routes are registered.
 */
function initialize() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

/** Mounts the unified exception handler. Call after all routes are registered. */
function finalize(app) {
  app.use(errorHandler);
  return app;
}

module.exports = { initialize, finalize };

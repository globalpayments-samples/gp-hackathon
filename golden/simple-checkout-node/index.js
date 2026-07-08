/**
 * simple-checkout-node — generated standalone sample project.
 * Composed by the Builder from the Global Payments component catalog.
 * Everything below the imports is signal: configuration, then one route per
 * selected component. The Baseplate hides the server boilerplate in ./core.
 */
'use strict';

const { initialize, finalize } = require('./core/baseplate');
const { loadConfig } = require('./core/config');

const config = loadConfig();

const app = initialize();

// -- token-helper: access token endpoint for Hosted Fields ------------------
const { generateAccessToken } = require('./components/token-helper');

app.get('/api/access-token', async (req, res, next) => {
  try {
    const { accessToken } = await generateAccessToken(config);
    res.json({
      accessToken,
      environment: (process.env.GP_API_ENVIRONMENT || 'sandbox').toLowerCase(),
    });
  } catch (err) {
    next(err);
  }
});

// -- charge: single-step authorization and capture ---------------------------
const { charge } = require('./components/charge');

app.post('/api/charge', async (req, res, next) => {
  try {
    const result = await charge({
      token: req.body.token,
      amount: req.body.amount || '29.99',
      currency: req.body.currency || 'USD',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

finalize(app);

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Sample project running on http://localhost:${port}`);
  });
}

module.exports = app;

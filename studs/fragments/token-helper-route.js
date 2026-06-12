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

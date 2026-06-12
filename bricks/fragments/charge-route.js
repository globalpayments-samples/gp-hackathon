// -- charge: single-step authorization and capture ---------------------------
const { charge } = require('./components/payments');

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

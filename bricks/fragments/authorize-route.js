// -- authorize: hold funds without capturing ---------------------------------
const { authorize } = require('./components/authorize');

app.post('/api/authorize', async (req, res, next) => {
  try {
    const result = await authorize({
      token: req.body.token,
      amount: req.body.amount || '29.99',
      currency: req.body.currency || 'USD',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// -- capture: settle a previously authorized transaction ---------------------
const { capture } = require('./components/capture');

app.post('/api/capture/:transactionId', async (req, res, next) => {
  try {
    const result = await capture({
      transactionId: req.params.transactionId,
      amount: req.body.amount,
      currency: req.body.currency || 'USD',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

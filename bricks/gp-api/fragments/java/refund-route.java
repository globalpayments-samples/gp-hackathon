routes.put("POST /api/payments/refund", body -> {
    LiveBoundary.requireCredentials();
    return GpApiPaymentLifecycle.refund(body);
});

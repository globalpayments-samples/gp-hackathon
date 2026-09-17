routes.put("POST /api/payments/verify", body -> {
    LiveBoundary.requireCredentials();
    return GpApiPaymentLifecycle.verify(body);
});

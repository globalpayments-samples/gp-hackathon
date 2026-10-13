routes.put("POST /api/payments/authorize", body -> {
    LiveBoundary.requireCredentials();
    return GpApiPaymentLifecycle.authorize(body);
});

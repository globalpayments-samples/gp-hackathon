routes.put("POST /api/payments/status", body -> {
    LiveBoundary.requireCredentials();
    return GpApiPaymentLifecycle.status(body);
});

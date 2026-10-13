routes.put("POST /api/payments/capture", body -> {
    LiveBoundary.requireCredentials();
    return GpApiPaymentLifecycle.capture(body);
});

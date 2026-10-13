routes.put("POST /api/payments/reverse", body -> {
    LiveBoundary.requireCredentials();
    return GpApiPaymentLifecycle.reverse(body);
});

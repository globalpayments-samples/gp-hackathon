app.MapPost("/api/payments/refund", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Refund(body));
});

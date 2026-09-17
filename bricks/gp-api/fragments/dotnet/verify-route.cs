app.MapPost("/api/payments/verify", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Verify(body));
});

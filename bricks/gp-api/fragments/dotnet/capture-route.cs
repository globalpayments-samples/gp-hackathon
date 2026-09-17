app.MapPost("/api/payments/capture", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Capture(body));
});

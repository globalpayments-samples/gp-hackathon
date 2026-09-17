app.MapPost("/api/credit/refund", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Refund(body));
});

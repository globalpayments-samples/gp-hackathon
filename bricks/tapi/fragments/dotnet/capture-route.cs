app.MapPost("/api/credit/capture", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Capture(body));
});

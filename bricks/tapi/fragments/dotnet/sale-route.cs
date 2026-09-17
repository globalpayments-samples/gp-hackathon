app.MapPost("/api/credit/sale", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Sale(body));
});

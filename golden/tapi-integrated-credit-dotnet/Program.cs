using System.Text.Json;
using GeneratedSample;

var requiredConfig = new[] { "TAPI_ACCOUNT_CREDENTIAL", "TAPI_API_SECRET", "TAPI_REGION" };
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok", platform = "tapi" }));

app.MapPost("/api/credit/capture", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Capture(body));
});

app.MapPost("/api/credit/refund", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Refund(body));
});

app.MapPost("/api/credit/status", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Status(body));
});

app.MapPost("/api/credit/void", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Void(body));
});

app.MapPost("/api/credit/authorize", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Authorize(body));
});

app.MapPost("/api/credit/sale", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(TapiCreditLifecycle.Sale(body));
});

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

public partial class Program;

using System.Text.Json;
using GeneratedSample;

var requiredConfig = new[] { "TAPI_ACCOUNT_CREDENTIAL", "TAPI_API_SECRET", "TAPI_REGION" };
var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);
var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (Exception error) when (!context.Response.HasStarted)
    {
        context.Response.StatusCode = error switch
        {
            MissingCredentialsException => 503,
            ArgumentException or BadHttpRequestException => 400,
            _ => 502,
        };
        await context.Response.WriteAsJsonAsync(new { error = new { message = error.Message } });
    }
});

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

using System.Text.Json;
using GeneratedSample;

var requiredConfig = new[] { "GP_API_ENVIRONMENT", "GP_APP_ID", "GP_APP_KEY" };
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

app.MapGet("/health", () => Results.Ok(new { status = "ok", platform = "gp-api" }));

app.MapPost("/api/payments/authorize", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Authorize(body));
});

app.MapPost("/api/payments/capture", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Capture(body));
});

app.MapPost("/api/payments/refund", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Refund(body));
});

app.MapPost("/api/payments/reverse", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Reverse(body));
});

app.MapPost("/api/payments/status", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Status(body));
});

app.MapPost("/api/payments/verify", (JsonElement body) =>
{
    LiveBoundary.RequireCredentials(requiredConfig);
    return Results.Ok(GpApiPaymentLifecycle.Verify(body));
});

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

public partial class Program;

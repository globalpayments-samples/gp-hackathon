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

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

public partial class Program;

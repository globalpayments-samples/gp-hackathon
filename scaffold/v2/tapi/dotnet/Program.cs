using System.Text.Json;
using GeneratedSample;

var requiredConfig = new[] { {{ CONFIG_CS_ARRAY }} };
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

app.MapGet("/health", () => Results.Ok(new { status = "ok", platform = "{{ PLATFORM_ID }}" }));

{{ ROUTE_HANDLERS }}

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

public partial class Program;

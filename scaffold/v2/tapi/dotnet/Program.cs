using System.Text.Json;
using GeneratedSample;

var requiredConfig = new[] { {{ CONFIG_CS_ARRAY }} };
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok", platform = "{{ PLATFORM_ID }}" }));

{{ ROUTE_HANDLERS }}

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

public partial class Program;

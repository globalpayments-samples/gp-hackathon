using System.Text.Json;
using GeneratedSample;

var requiredConfig = new[] { "GP_API_ENVIRONMENT", "GP_APP_ID", "GP_APP_KEY" };
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok", platform = "gp-api" }));

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

public partial class Program;

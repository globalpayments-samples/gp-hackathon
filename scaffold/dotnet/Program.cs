/**
 * {{ PROJECT_NAME }} — generated standalone sample project.
 * Composed by the Builder from the Global Payments component catalog.
 * Every endpoint below is signal: one handler per selected component.
 * core/Config.cs hides SDK setup; route handlers come from component fragments.
 */
using System.Text.Json;
{{ IMPORTS }}

Config.Initialize();

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var publicDir = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "public");
if (System.IO.Directory.Exists(publicDir))
{
    var fp = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(publicDir);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fp, RequestPath = "" });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fp, RequestPath = "" });
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

{{ ROUTE_HANDLERS }}

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");
Console.WriteLine($"{{ PROJECT_TITLE }} running on http://localhost:{port}");
app.Run();

// -- authorize: hold funds without capturing ----------------------------------

app.MapPost("/api/authorize", async (HttpContext ctx) =>
{
    try
    {
        var body     = await ctx.Request.ReadFromJsonAsync<JsonElement>();
        var token    = body.TryGetProperty("token",    out var t) ? t.GetString() ?? "" : "";
        var amount   = body.TryGetProperty("amount",   out var a) ? decimal.Parse(a.GetString() ?? "29.99", System.Globalization.CultureInfo.InvariantCulture) : 29.99m;
        var currency = body.TryGetProperty("currency", out var c) ? c.GetString() ?? "USD" : "USD";
        var result   = await Payments.Authorize(token, amount, currency);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { error = new { type = ex.GetType().Name, message = ex.Message, status = 500 } },
            statusCode: 500);
    }
});

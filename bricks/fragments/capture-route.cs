// -- capture: settle a previously authorized transaction ----------------------

app.MapPost("/api/capture/{transactionId}", async (string transactionId, HttpContext ctx) =>
{
    try
    {
        var body     = await ctx.Request.ReadFromJsonAsync<JsonElement>();
        decimal? amount = body.TryGetProperty("amount", out var a) && a.ValueKind != JsonValueKind.Null
            ? decimal.Parse(a.GetString() ?? "0", System.Globalization.CultureInfo.InvariantCulture) : (decimal?)null;
        var currency = body.TryGetProperty("currency", out var c) ? c.GetString() ?? "USD" : "USD";
        var result   = await Payments.Capture(Uri.UnescapeDataString(transactionId), amount, currency);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { error = new { type = ex.GetType().Name, message = ex.Message, status = 500 } },
            statusCode: 500);
    }
});

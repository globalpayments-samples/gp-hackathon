// -- token-helper: access token endpoint for Hosted Fields ------------------

app.MapGet("/api/access-token", async () =>
{
    try
    {
        var result = await TokenHelper.GenerateAccessToken();
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { error = new { type = ex.GetType().Name, message = ex.Message, status = 500 } },
            statusCode: 500);
    }
});

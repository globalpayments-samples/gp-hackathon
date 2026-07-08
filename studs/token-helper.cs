/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 * sdk: GlobalPayments.Api (GpApiConfig, GpApiService)
 */

using GlobalPayments.Api;
using GlobalPayments.Api.Entities;
using GlobalPayments.Api.Services;

public static class TokenHelper
{
    public static async Task<object> GenerateAccessToken()
    {
        var envStr = (System.Environment.GetEnvironmentVariable("GP_API_ENVIRONMENT") ?? "sandbox").ToLower();
        var config = new GpApiConfig
        {
            AppId       = System.Environment.GetEnvironmentVariable("GP_APP_ID"),
            AppKey      = System.Environment.GetEnvironmentVariable("GP_APP_KEY"),
            Environment = envStr == "production"
                ? GlobalPayments.Api.Entities.Environment.PRODUCTION
                : GlobalPayments.Api.Entities.Environment.TEST,
            Country     = System.Environment.GetEnvironmentVariable("GP_COUNTRY") ?? "US",
            Permissions = new[] { "PMT_POST_Create_Single" },
        };

        var response = await Task.Run(() => GpApiService.GenerateTransactionKey(config));
        return new { accessToken = response.Token, environment = envStr };
    }
}

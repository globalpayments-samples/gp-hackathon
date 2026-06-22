/**
 * layer: baseplate
 * purpose: Configuration Manager — loads .env and registers GpApiConfig with
 *          the SDK ServicesContainer. Call Initialize() once at startup.
 * sdk: GlobalPayments.Api (GpApiConfig, ServicesContainer, Channel, Environment)
 */

using dotenv.net;
using GlobalPayments.Api;
using GlobalPayments.Api.Entities;
using GlobalPayments.Api.ServiceConfigs;

public static class Config
{
    public static void Initialize()
    {
        DotEnv.Load();

        var appId = System.Environment.GetEnvironmentVariable("GP_APP_ID");
        var appKey = System.Environment.GetEnvironmentVariable("GP_APP_KEY");

        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appKey))
        {
            var missing = new System.Collections.Generic.List<string>();
            if (string.IsNullOrEmpty(appId)) missing.Add("GP_APP_ID");
            if (string.IsNullOrEmpty(appKey)) missing.Add("GP_APP_KEY");
            throw new InvalidOperationException(
                $"Missing required environment variables: {string.Join(", ", missing)}. " +
                "Copy .env.example to .env and fill in your sandbox credentials.");
        }

        var envStr = (System.Environment.GetEnvironmentVariable("GP_API_ENVIRONMENT") ?? "sandbox").ToLower();
        var environment = envStr == "production"
            ? GlobalPayments.Api.Entities.Environment.PRODUCTION
            : GlobalPayments.Api.Entities.Environment.TEST;

        // Do NOT set TransactionProcessingAccountName — SDK auto-detects from credentials.
        ServicesContainer.ConfigureService(new GpApiConfig
        {
            AppId = appId,
            AppKey = appKey,
            Environment = environment,
            Channel = Channel.CardNotPresent,
            Country = System.Environment.GetEnvironmentVariable("GP_COUNTRY") ?? "US",
        });
    }
}

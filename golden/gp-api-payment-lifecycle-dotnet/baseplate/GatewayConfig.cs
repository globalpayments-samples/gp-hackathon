using GlobalPayments.Api;
using GlobalPayments.Api.Entities;

namespace GeneratedSample;

public static class GatewayConfig
{
    public static void Configure()
    {
        var environment = string.Equals(
            System.Environment.GetEnvironmentVariable("GP_API_ENVIRONMENT"),
            "production",
            StringComparison.OrdinalIgnoreCase)
            ? GlobalPayments.Api.Entities.Environment.PRODUCTION
            : GlobalPayments.Api.Entities.Environment.TEST;

        ServicesContainer.ConfigureService(new GpApiConfig
        {
            AppId = System.Environment.GetEnvironmentVariable("GP_APP_ID"),
            AppKey = System.Environment.GetEnvironmentVariable("GP_APP_KEY"),
            Channel = Channel.CardNotPresent,
            Country = System.Environment.GetEnvironmentVariable("GP_COUNTRY") ?? "US",
            Environment = environment,
        });
    }
}

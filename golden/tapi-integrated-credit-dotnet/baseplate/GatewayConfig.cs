using GlobalPayments.Api;

namespace GeneratedSample;

public static class GatewayConfig
{
    public static void Configure()
    {
        ServicesContainer.ConfigureService(new TransactionApiConfig
        {
            AccountCredential = System.Environment.GetEnvironmentVariable("TAPI_ACCOUNT_CREDENTIAL"),
            AppSecret = System.Environment.GetEnvironmentVariable("TAPI_API_SECRET"),
            Region = System.Environment.GetEnvironmentVariable("TAPI_REGION"),
            Environment = GlobalPayments.Api.Entities.Environment.TEST,
        });
    }
}

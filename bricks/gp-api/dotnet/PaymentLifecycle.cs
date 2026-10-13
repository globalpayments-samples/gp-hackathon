using System.Globalization;
using System.Text.Json;
using GlobalPayments.Api.Entities;
using GlobalPayments.Api.PaymentMethods;
using GlobalPayments.Api.Services;

namespace GeneratedSample;

public static class GpApiPaymentLifecycle
{
    public static object Verify(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Card(body).Verify().WithCurrency(Currency(body)).Execute());
    }

    public static object Authorize(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Card(body).Authorize(Amount(body, 29.99m)).WithCurrency(Currency(body)).Execute());
    }

    public static object Capture(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Transaction.FromId(RequiredString(body, "transactionId"))
            .Capture(OptionalAmount(body))
            .WithCurrency(Currency(body))
            .Execute());
    }

    public static object Refund(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Transaction.FromId(RequiredString(body, "transactionId"))
            .Refund(OptionalAmount(body))
            .WithCurrency(Currency(body))
            .Execute());
    }

    public static object Reverse(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Transaction.FromId(RequiredString(body, "transactionId"))
            .Reverse(OptionalAmount(body))
            .WithCurrency(Currency(body))
            .Execute());
    }

    public static object Status(JsonElement body)
    {
        GatewayConfig.Configure();
        var summary = ReportingService.TransactionDetail(RequiredString(body, "transactionId")).Execute();
        return new
        {
            transactionId = summary.TransactionId,
            status = summary.Status ?? summary.TransactionStatus,
            responseCode = summary.GatewayResponseCode,
            responseMessage = summary.GatewayResponseMessage,
        };
    }

    private static CreditCardData Card(JsonElement body) => new()
    {
        Token = RequiredString(body, "token"),
    };

    private static object Serialize(Transaction response) => new
    {
        transactionId = response.TransactionId,
        status = response.Status ?? response.ResponseMessage,
        responseCode = response.ResponseCode,
        responseMessage = response.ResponseMessage,
        authorizationCode = response.AuthorizationCode,
    };

    private static string RequiredString(JsonElement body, string name)
    {
        if (!body.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw new ArgumentException($"{name} is required");
        }
        return value.GetString()!.Trim();
    }

    private static string Currency(JsonElement body) =>
        body.TryGetProperty("currency", out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? "USD"
            : "USD";

    private static decimal Amount(JsonElement body, decimal fallback) => OptionalAmount(body) ?? fallback;

    private static decimal? OptionalAmount(JsonElement body)
    {
        if (!body.TryGetProperty("amount", out var value)) return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var number)) return number;
        if (value.ValueKind == JsonValueKind.String &&
            decimal.TryParse(value.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out number)) return number;
        throw new ArgumentException("amount must be a decimal number");
    }
}

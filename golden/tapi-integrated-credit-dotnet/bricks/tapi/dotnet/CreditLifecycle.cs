using System.Globalization;
using System.Text.Json;
using GlobalPayments.Api.Builders;
using GlobalPayments.Api.Entities;
using GlobalPayments.Api.PaymentMethods;
using GlobalPayments.Api.Services;

namespace GeneratedSample;

public static class TapiCreditLifecycle
{
    public static object Sale(JsonElement body)
    {
        GatewayConfig.Configure();
        var builder = Card(body).Charge(Amount(body, 29.99m)).WithCurrency(Currency(body));
        return Serialize(WithRequestMetadata(builder, body).Execute());
    }

    public static object Authorize(JsonElement body)
    {
        GatewayConfig.Configure();
        var builder = Card(body).Authorize(Amount(body, 29.99m)).WithCurrency(Currency(body));
        return Serialize(WithRequestMetadata(builder, body).Execute());
    }

    public static object Capture(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Transaction.FromId(RequiredString(body, "transactionId"), PaymentMethodType.Credit)
            .Capture(OptionalAmount(body))
            .WithCurrency(Currency(body))
            .Execute());
    }

    public static object Void(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Transaction.FromId(
                RequiredString(body, "transactionId"),
                OriginalTransactionType(body),
                PaymentMethodType.Credit)
            .Void(null, OptionalAmount(body))
            .WithCurrency(Currency(body))
            .Execute());
    }

    public static object Refund(JsonElement body)
    {
        GatewayConfig.Configure();
        return Serialize(Transaction.FromId(
                RequiredString(body, "transactionId"),
                OriginalTransactionType(body),
                PaymentMethodType.Credit)
            .Refund(OptionalAmount(body))
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
            clientTransactionId = summary.ClientTransactionId,
            status = summary.Status ?? summary.TransactionStatus,
            responseCode = summary.GatewayResponseCode,
            responseMessage = summary.GatewayResponseMessage,
        };
    }

    private static AuthorizationBuilder WithRequestMetadata(AuthorizationBuilder builder, JsonElement body)
    {
        var clientTransactionId = RequestMetadata.ClientTransactionId(body);
        return clientTransactionId is null ? builder : builder.WithClientTransactionId(clientTransactionId);
    }

    private static CreditCardData Card(JsonElement body)
    {
        var card = new CreditCardData();
        if (body.TryGetProperty("token", out var token) && token.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(token.GetString()))
        {
            card.Token = token.GetString()!.Trim();
            return card;
        }

        card.Number = RequiredString(body, "number");
        card.ExpMonth = RequiredInt(body, "expMonth");
        card.ExpYear = RequiredInt(body, "expYear");
        if (body.TryGetProperty("cvn", out var cvn) && cvn.ValueKind == JsonValueKind.String) card.Cvn = cvn.GetString();
        return card;
    }

    private static object Serialize(Transaction response) => new
    {
        transactionId = response.TransactionId,
        clientTransactionId = response.ClientTransactionId,
        status = response.Status ?? response.ResponseMessage,
        responseCode = response.ResponseCode,
        responseMessage = response.ResponseMessage,
        authorizationCode = response.AuthorizationCode,
    };

    private static TransactionType OriginalTransactionType(JsonElement body)
    {
        if (!body.TryGetProperty("originalTransactionType", out var value)) return TransactionType.Sale;
        return value.GetString()?.ToLowerInvariant() switch
        {
            "auth" or "authorize" => TransactionType.Auth,
            "refund" => TransactionType.Refund,
            "sale" => TransactionType.Sale,
            _ => throw new ArgumentException("originalTransactionType must be sale, auth, or refund"),
        };
    }

    private static string RequiredString(JsonElement body, string name)
    {
        if (!body.TryGetProperty(name, out var value) || value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw new ArgumentException($"{name} is required");
        }
        return value.GetString()!.Trim();
    }

    private static int RequiredInt(JsonElement body, string name)
    {
        if (!body.TryGetProperty(name, out var value)) throw new ArgumentException($"{name} is required");
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number)) return number;
        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out number)) return number;
        throw new ArgumentException($"{name} must be an integer");
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

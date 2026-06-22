/**
 * layer: brick
 * purpose: Atomic SDK payment operations — Charge (single-step auth+capture),
 *          Authorize (hold funds), Capture (settle a prior authorization).
 *          Isolated, stateless methods with predictable inputs and outputs.
 *
 * sdk: GlobalPayments.Api (CreditCardData, Transaction)
 * reference: online-card-payments/dotnet/Program.cs
 */

using GlobalPayments.Api.Entities;
using GlobalPayments.Api.PaymentMethods;

public static class Payments
{
    private static object Summarize(Transaction tx) => new
    {
        transactionId     = tx.TransactionId,
        status            = tx.ResponseMessage,
        responseCode      = tx.ResponseCode,
        authorizationCode = tx.AuthorizationCode,
    };

    public static async Task<object> Charge(string token, decimal amount, string currency)
    {
        var card = new CreditCardData { Token = token };
        var tx   = await Task.Run(() => card.Charge(amount).WithCurrency(currency).Execute());
        return Summarize(tx);
    }

    public static async Task<object> Authorize(string token, decimal amount, string currency)
    {
        var card = new CreditCardData { Token = token };
        var tx   = await Task.Run(() => card.Authorize(amount).WithCurrency(currency).Execute());
        return Summarize(tx);
    }

    public static async Task<object> Capture(string transactionId, decimal? amount, string currency)
    {
        var builder = Transaction.FromId(transactionId).Capture(amount);
        if (!string.IsNullOrEmpty(currency)) builder = builder.WithCurrency(currency);
        var tx = await Task.Run(() => builder.Execute());
        return Summarize(tx);
    }
}

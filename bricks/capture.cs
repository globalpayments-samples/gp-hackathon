/**
 * layer: brick
 * purpose: Capture — settles a previously authorized transaction by id.
 * sdk: GlobalPayments.Api (Transaction)
 */

using GlobalPayments.Api.Entities;

public static partial class Payments
{
    public static async Task<object> Capture(string transactionId, decimal? amount, string currency)
    {
        var builder = Transaction.FromId(transactionId).Capture(amount);
        if (!string.IsNullOrEmpty(currency)) builder = builder.WithCurrency(currency);
        var tx = await Task.Run(() => builder.Execute());
        return new
        {
            transactionId     = tx.TransactionId,
            status            = tx.ResponseMessage,
            responseCode      = tx.ResponseCode,
            authorizationCode = tx.AuthorizationCode,
        };
    }
}

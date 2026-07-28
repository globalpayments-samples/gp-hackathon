/**
 * layer: brick
 * purpose: Charge — single-step authorization and capture of a tokenized card.
 * sdk: GlobalPayments.Api (CreditCardData)
 */

using GlobalPayments.Api.Entities;
using GlobalPayments.Api.PaymentMethods;

public static partial class Payments
{
    public static async Task<object> Charge(string token, decimal amount, string currency)
    {
        var card = new CreditCardData { Token = token };
        var tx   = await Task.Run(() => card.Charge(amount).WithCurrency(currency).Execute());
        return new
        {
            transactionId     = tx.TransactionId,
            status            = tx.ResponseMessage,
            responseCode      = tx.ResponseCode,
            authorizationCode = tx.AuthorizationCode,
        };
    }
}

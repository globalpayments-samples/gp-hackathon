package com.globalpayments.sample;

import com.global.api.entities.Transaction;
import com.global.api.paymentMethods.CreditCardData;
import org.json.JSONObject;

/**
 * layer: brick
 * purpose: Atomic SDK payment operations — Charge (single-step auth+capture),
 *          Authorize (hold funds), Capture (settle a prior authorization).
 *          Isolated, stateless methods with predictable inputs and outputs.
 *
 * sdk: globalpayments-sdk (CreditCardData, Transaction)
 * reference: online-card-payments/java/ProcessPaymentServlet.java
 */
public class Payments {

    private static JSONObject summarize(Transaction tx) {
        JSONObject result = new JSONObject();
        result.put("transactionId",     tx.getTransactionId());
        String status = tx.getResponseMessage();
        result.put("status",            status);
        result.put("responseCode",      tx.getResponseCode());
        result.put("authorizationCode", tx.getAuthorizationCode() != null ? tx.getAuthorizationCode() : JSONObject.NULL);
        return result;
    }

    public static JSONObject charge(String token, String amount, String currency) throws Exception {
        CreditCardData card = new CreditCardData();
        card.setToken(token);
        Transaction tx = card.charge(new java.math.BigDecimal(amount))
            .withCurrency(currency)
            .execute();
        return summarize(tx);
    }

    public static JSONObject authorize(String token, String amount, String currency) throws Exception {
        CreditCardData card = new CreditCardData();
        card.setToken(token);
        Transaction tx = card.authorize(new java.math.BigDecimal(amount))
            .withCurrency(currency)
            .execute();
        return summarize(tx);
    }

    public static JSONObject capture(String transactionId, String amount, String currency) throws Exception {
        com.global.api.builders.ManagementBuilder builder =
            Transaction.fromId(transactionId).capture(
                amount != null ? new java.math.BigDecimal(amount) : null
            );
        if (currency != null && !currency.isEmpty()) {
            builder = builder.withCurrency(currency);
        }
        return summarize(builder.execute());
    }
}

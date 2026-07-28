package com.globalpayments.sample;

import com.global.api.entities.Transaction;
import org.json.JSONObject;

/**
 * layer: brick
 * purpose: Capture — settles a previously authorized transaction by id.
 * sdk: globalpayments-sdk (Transaction)
 */
public class Capture {

    public static JSONObject capture(String transactionId, String amount, String currency) throws Exception {
        com.global.api.builders.ManagementBuilder builder =
            Transaction.fromId(transactionId).capture(
                amount != null ? new java.math.BigDecimal(amount) : null
            );
        if (currency != null && !currency.isEmpty()) {
            builder = builder.withCurrency(currency);
        }
        Transaction tx = builder.execute();
        JSONObject result = new JSONObject();
        result.put("transactionId",     tx.getTransactionId());
        result.put("status",            tx.getResponseMessage());
        result.put("responseCode",      tx.getResponseCode());
        result.put("authorizationCode", tx.getAuthorizationCode() != null ? tx.getAuthorizationCode() : JSONObject.NULL);
        return result;
    }
}

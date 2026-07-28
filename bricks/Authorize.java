package com.globalpayments.sample;

import com.global.api.entities.Transaction;
import com.global.api.paymentMethods.CreditCardData;
import org.json.JSONObject;

/**
 * layer: brick
 * purpose: Authorize — places a hold on funds without capturing them.
 * sdk: globalpayments-sdk (CreditCardData)
 */
public class Authorize {

    public static JSONObject authorize(String token, String amount, String currency) throws Exception {
        CreditCardData card = new CreditCardData();
        card.setToken(token);
        Transaction tx = card.authorize(new java.math.BigDecimal(amount))
            .withCurrency(currency)
            .execute();
        JSONObject result = new JSONObject();
        result.put("transactionId",     tx.getTransactionId());
        result.put("status",            tx.getResponseMessage());
        result.put("responseCode",      tx.getResponseCode());
        result.put("authorizationCode", tx.getAuthorizationCode() != null ? tx.getAuthorizationCode() : JSONObject.NULL);
        return result;
    }
}

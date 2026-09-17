package com.globalpayments.sample;

import com.global.api.builders.ManagementBuilder;
import com.global.api.entities.Transaction;
import com.global.api.entities.TransactionSummary;
import com.global.api.paymentMethods.CreditCardData;
import com.global.api.services.ReportingService;
import java.math.BigDecimal;
import org.json.JSONObject;

public final class GpApiPaymentLifecycle {
    private GpApiPaymentLifecycle() {}

    public static JSONObject verify(JSONObject body) throws Exception {
        Config.configure();
        return serialize(card(body).verify().withCurrency(currency(body)).execute());
    }

    public static JSONObject authorize(JSONObject body) throws Exception {
        Config.configure();
        return serialize(card(body).authorize(amount(body, "29.99")).withCurrency(currency(body)).execute());
    }

    public static JSONObject capture(JSONObject body) throws Exception {
        Config.configure();
        return serialize(management(body, "capture").execute());
    }

    public static JSONObject refund(JSONObject body) throws Exception {
        Config.configure();
        return serialize(management(body, "refund").execute());
    }

    public static JSONObject reverse(JSONObject body) throws Exception {
        Config.configure();
        return serialize(management(body, "reverse").execute());
    }

    public static JSONObject status(JSONObject body) throws Exception {
        Config.configure();
        TransactionSummary summary = ReportingService.transactionDetail(requiredString(body, "transactionId")).execute();
        return new JSONObject()
            .put("transactionId", nullable(summary.getTransactionId()))
            .put("status", nullable(summary.getStatus()));
    }

    private static ManagementBuilder management(JSONObject body, String operation) {
        BigDecimal amount = optionalAmount(body);
        Transaction transaction = Transaction.fromId(requiredString(body, "transactionId"));
        ManagementBuilder builder;
        if ("capture".equals(operation)) {
            builder = transaction.capture(amount);
        } else if ("refund".equals(operation)) {
            builder = transaction.refund(amount);
        } else if ("reverse".equals(operation)) {
            builder = transaction.reverse(amount);
        } else {
            throw new IllegalArgumentException("Unsupported management operation");
        }
        return builder.withCurrency(currency(body));
    }

    private static CreditCardData card(JSONObject body) {
        CreditCardData card = new CreditCardData();
        card.setToken(requiredString(body, "token"));
        return card;
    }

    private static JSONObject serialize(Transaction response) {
        return new JSONObject()
            .put("transactionId", nullable(response.getTransactionId()))
            .put("status", nullable(response.getResponseMessage()))
            .put("responseCode", nullable(response.getResponseCode()))
            .put("responseMessage", nullable(response.getResponseMessage()))
            .put("authorizationCode", nullable(response.getAuthorizationCode()));
    }

    private static String requiredString(JSONObject body, String name) {
        String value = body.optString(name, "").trim();
        if (value.isEmpty()) throw new IllegalArgumentException(name + " is required");
        return value;
    }

    private static String currency(JSONObject body) {
        return body.optString("currency", "USD");
    }

    private static BigDecimal amount(JSONObject body, String fallback) {
        BigDecimal value = optionalAmount(body);
        return value == null ? new BigDecimal(fallback) : value;
    }

    private static BigDecimal optionalAmount(JSONObject body) {
        if (!body.has("amount") || body.isNull("amount")) return null;
        try {
            return new BigDecimal(body.get("amount").toString());
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("amount must be a decimal number", error);
        }
    }

    private static Object nullable(Object value) {
        return value == null ? JSONObject.NULL : value;
    }
}

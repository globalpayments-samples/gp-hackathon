package com.globalpayments.sample;

import com.global.api.entities.exceptions.ApiException;
import com.global.api.entities.exceptions.BuilderException;
import com.global.api.entities.exceptions.ConfigurationException;
import com.global.api.entities.exceptions.GatewayException;
import jakarta.servlet.http.HttpServletResponse;
import org.json.JSONObject;
import java.io.IOException;

/**
 * layer: baseplate
 * purpose: Unified error handler — catches GP SDK exceptions and normalizes
 *          them into structured JSON error responses.
 * sdk: globalpayments-sdk (exception hierarchy)
 */
public class ErrorHandler {

    public static void send(HttpServletResponse response, Exception e) throws IOException {
        boolean isSdkError = e instanceof ApiException
            || e instanceof GatewayException
            || e instanceof BuilderException
            || e instanceof ConfigurationException;

        int status = isSdkError ? 502 : 500;
        response.setStatus(status);

        JSONObject error = new JSONObject();
        error.put("type", e.getClass().getSimpleName());
        error.put("message", e.getMessage() != null ? e.getMessage() : "Unexpected error");
        error.put("status", status);

        JSONObject body = new JSONObject();
        body.put("error", error);
        response.getWriter().write(body.toString());
    }
}

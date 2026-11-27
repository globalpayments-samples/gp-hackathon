package com.globalpayments.sample;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;
import org.json.JSONObject;

public final class Main {
    @FunctionalInterface
    public interface RouteHandler {
        JSONObject handle(JSONObject body) throws Exception;
    }

    private Main() {}

    public static Map<String, RouteHandler> routes() {
        Map<String, RouteHandler> routes = new TreeMap<>();
        routes.put("POST /api/payments/authorize", body -> {
            LiveBoundary.requireCredentials();
            return GpApiPaymentLifecycle.authorize(body);
        });

        routes.put("POST /api/payments/capture", body -> {
            LiveBoundary.requireCredentials();
            return GpApiPaymentLifecycle.capture(body);
        });

        routes.put("POST /api/payments/refund", body -> {
            LiveBoundary.requireCredentials();
            return GpApiPaymentLifecycle.refund(body);
        });

        routes.put("POST /api/payments/reverse", body -> {
            LiveBoundary.requireCredentials();
            return GpApiPaymentLifecycle.reverse(body);
        });

        routes.put("POST /api/payments/status", body -> {
            LiveBoundary.requireCredentials();
            return GpApiPaymentLifecycle.status(body);
        });

        routes.put("POST /api/payments/verify", body -> {
            LiveBoundary.requireCredentials();
            return GpApiPaymentLifecycle.verify(body);
        });
        return routes;
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "3000"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        Map<String, RouteHandler> routes = routes();
        server.createContext("/", exchange -> handle(exchange, routes));
        server.start();
    }

    private static void handle(HttpExchange exchange, Map<String, RouteHandler> routes) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if ("GET".equals(exchange.getRequestMethod()) && "/health".equals(path)) {
            respond(exchange, 200, new JSONObject().put("status", "ok").put("platform", "gp-api"));
            return;
        }

        RouteHandler handler = routes.get(exchange.getRequestMethod() + " " + path);
        if (handler == null) {
            respond(exchange, 404, error("Route not found"));
            return;
        }

        try {
            String raw = readBody(exchange.getRequestBody());
            JSONObject body;
            try {
                body = raw.trim().isEmpty() ? new JSONObject() : new JSONObject(raw);
            } catch (org.json.JSONException error) {
                throw new IllegalArgumentException("Request body must be valid JSON", error);
            }
            respond(exchange, 200, handler.handle(body));
        } catch (IllegalArgumentException error) {
            respond(exchange, 400, error(error.getMessage()));
        } catch (IllegalStateException error) {
            respond(exchange, 503, error(error.getMessage()));
        } catch (com.global.api.entities.exceptions.GatewayException error) {
            respond(exchange, 502, error(gatewayMessage(error)));
        } catch (Exception error) {
            error.printStackTrace();
            respond(exchange, 502, error("Unexpected error"));
        }
    }

    // GP's own error code and message go back like they do in the other
    // languages. Any other failure is only logged.
    private static String gatewayMessage(com.global.api.entities.exceptions.GatewayException error) {
        if (error.getResponseCode() != null && error.getLocalizedMessage() != null) {
            return error.getLocalizedMessage();
        }
        error.printStackTrace();
        return "Unexpected error";
    }

    private static JSONObject error(String message) {
        return new JSONObject().put("error", new JSONObject().put("message", message));
    }

    private static String readBody(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int count;
        while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }

    private static void respond(HttpExchange exchange, int status, JSONObject payload) throws IOException {
        byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }
}

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
        {{ ROUTE_HANDLERS }}
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
            respond(exchange, 200, new JSONObject().put("status", "ok").put("platform", "{{ PLATFORM_ID }}"));
            return;
        }

        RouteHandler handler = routes.get(exchange.getRequestMethod() + " " + path);
        if (handler == null) {
            respond(exchange, 404, error("Route not found"));
            return;
        }

        try {
            String raw = readBody(exchange.getRequestBody());
            respond(exchange, 200, handler.handle(raw.trim().isEmpty() ? new JSONObject() : new JSONObject(raw)));
        } catch (IllegalArgumentException error) {
            respond(exchange, 400, error(error.getMessage()));
        } catch (IllegalStateException error) {
            respond(exchange, 503, error(error.getMessage()));
        } catch (Exception error) {
            respond(exchange, 502, error(error.getMessage()));
        }
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

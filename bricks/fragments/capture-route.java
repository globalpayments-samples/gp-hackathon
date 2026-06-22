// -- capture: settle a previously authorized transaction ----------------------

if ("POST".equals(method) && uri.startsWith("/api/capture/")) {
    try {
        String transactionId = java.net.URLDecoder.decode(
            uri.substring("/api/capture/".length()), java.nio.charset.StandardCharsets.UTF_8);
        org.json.JSONObject body = new org.json.JSONObject(
            new java.io.BufferedReader(request.getReader()).lines()
                .collect(java.util.stream.Collectors.joining()));
        String amount   = body.has("amount") && !body.isNull("amount") ? body.optString("amount") : null;
        String currency = body.optString("currency", "USD");
        org.json.JSONObject result = Payments.capture(transactionId, amount, currency);
        response.getWriter().write(result.toString());
    } catch (Exception e) {
        ErrorHandler.send(response, e);
    }
    return;
}

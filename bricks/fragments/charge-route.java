// -- charge: single-step authorization and capture ---------------------------

if ("POST".equals(method) && "/api/charge".equals(uri)) {
    try {
        org.json.JSONObject body = new org.json.JSONObject(
            new java.io.BufferedReader(request.getReader()).lines()
                .collect(java.util.stream.Collectors.joining()));
        String token    = body.optString("token", "");
        String amount   = body.optString("amount", "29.99");
        String currency = body.optString("currency", "USD");
        org.json.JSONObject result = Charge.charge(token, amount, currency);
        response.getWriter().write(result.toString());
    } catch (Exception e) {
        ErrorHandler.send(response, e);
    }
    return;
}

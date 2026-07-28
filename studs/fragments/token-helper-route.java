// -- token-helper: access token endpoint for Hosted Fields ------------------

if ("GET".equals(method) && "/api/access-token".equals(uri)) {
    try {
        JSONObject result = TokenHelper.generateAccessToken();
        response.getWriter().write(result.toString());
    } catch (Exception e) {
        ErrorHandler.send(response, e);
    }
    return;
}

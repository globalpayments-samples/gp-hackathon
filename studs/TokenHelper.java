package com.globalpayments.sample;

import io.github.cdimascio.dotenv.Dotenv;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;
import java.util.zip.InflaterInputStream;

/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 *
 * Implementation: direct HttpURLConnection REST call (not the GP Java SDK).
 * All four GP-Projects language implementations use direct REST for this step
 * because the SDK does not expose the PMT_POST_Create_Single permission scope.
 *
 * Reference: online-card-payments/java/ProcessPaymentServlet.java
 * Protocol:  POST /ucp/accesstoken with SHA-512(nonce + appKey) secret
 *            and X-GP-Version: 2021-03-22 header.
 */
public class TokenHelper {

    private static final Dotenv dotenv = Dotenv.load();

    private static String generateNonce() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static String hashSecret(String nonce, String appKey) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-512");
        byte[] hash = digest.digest((nonce + appKey).getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    public static JSONObject generateAccessToken() throws Exception {
        String appId = dotenv.get("GP_APP_ID");
        String appKey = dotenv.get("GP_APP_KEY");
        String env = dotenv.get("GP_API_ENVIRONMENT", "sandbox").toLowerCase();

        String nonce = generateNonce();
        String secret = hashSecret(nonce, appKey);

        String endpoint = "production".equals(env)
            ? "https://apis.globalpay.com/ucp/accesstoken"
            : "https://apis.sandbox.globalpay.com/ucp/accesstoken";

        JSONObject payload = new JSONObject();
        payload.put("app_id", appId);
        payload.put("nonce", nonce);
        payload.put("secret", secret);
        payload.put("grant_type", "client_credentials");
        payload.put("seconds_to_expire", 600);
        payload.put("permissions", new String[]{"PMT_POST_Create_Single"});

        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("X-GP-Version", "2021-03-22");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        InputStream rawStream = status == 200 ? conn.getInputStream() : conn.getErrorStream();
        String encoding = conn.getHeaderField("Content-Encoding");
        InputStream effectiveStream = rawStream;
        if (encoding != null) {
            String enc = encoding.toLowerCase();
            if (enc.contains("gzip")) effectiveStream = new GZIPInputStream(rawStream);
            else if (enc.contains("deflate")) effectiveStream = new InflaterInputStream(rawStream);
        }

        String body;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(effectiveStream, StandardCharsets.UTF_8))) {
            body = reader.lines().collect(Collectors.joining());
        }

        if (status != 200) {
            JSONObject err = new JSONObject(body);
            String msg = err.optString("error_description", err.optString("message", "Failed to generate access token"));
            throw new RuntimeException(msg);
        }

        JSONObject data = new JSONObject(body);
        JSONObject result = new JSONObject();
        result.put("accessToken", data.getString("token"));
        result.put("environment", env);
        return result;
    }
}

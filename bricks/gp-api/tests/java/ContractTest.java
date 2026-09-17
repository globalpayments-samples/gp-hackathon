package com.globalpayments.sample;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;

final class ContractTest {
    @Test
    void exposesOnlyFixedLifecycleRoutes() {
        assertEquals(new HashSet<String>(Arrays.asList(
            "POST /api/payments/authorize",
            "POST /api/payments/capture",
            "POST /api/payments/refund",
            "POST /api/payments/reverse",
            "POST /api/payments/status",
            "POST /api/payments/verify"
        )), Main.routes().keySet());
    }

    @Test
    void fixtureAndOfficialSdkIdiomsRemainStable() throws IOException {
        JSONObject fixture = new JSONObject(read(projectFile("tests", "fixtures", "lifecycle.json")));
        assertEquals("single-use-token-from-hosted-fields", fixture.getJSONObject("tokenPayment").getString("token"));
        String source = read(projectFile("bricks", "gp-api", "java", "GpApiPaymentLifecycle.java"));
        assertTrue(source.contains("CreditCardData"));
        assertTrue(source.contains("Transaction.fromId"));
        assertTrue(source.contains("ReportingService.transactionDetail"));
        assertFalse(source.contains(":operation"));
    }

    private static Path projectFile(String... parts) {
        Path current = Paths.get("").toAbsolutePath();
        while (current != null && !Files.exists(current.resolve("pom.xml"))) current = current.getParent();
        if (current == null) throw new IllegalStateException("Generated project root not found");
        Path result = current;
        for (String part : parts) result = result.resolve(part);
        return result;
    }

    private static String read(Path path) throws IOException {
        return new String(Files.readAllBytes(path), java.nio.charset.StandardCharsets.UTF_8);
    }
}

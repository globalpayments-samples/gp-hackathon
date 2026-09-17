package com.globalpayments.sample;

import java.util.Arrays;

public final class LiveBoundary {
    public static final String[] REQUIRED = { {{ CONFIG_JAVA_ARRAY }} };

    private LiveBoundary() {}

    public static String[] missingCredentials() {
        return Arrays.stream(REQUIRED)
            .filter(name -> System.getenv(name) == null || System.getenv(name).trim().isEmpty())
            .sorted()
            .toArray(String[]::new);
    }

    public static void requireCredentials() {
        String[] missing = missingCredentials();
        if (missing.length > 0) {
            throw new IllegalStateException("Live call blocked: missing " + String.join(", ", missing));
        }
    }
}

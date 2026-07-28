package com.globalpayments.sample;

import com.global.api.ServicesContainer;
import com.global.api.entities.enums.Channel;
import com.global.api.entities.enums.Environment;
import com.global.api.serviceConfigs.GpApiConfig;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.servlet.ServletException;

/**
 * layer: baseplate
 * purpose: Configuration Manager — loads .env and registers GpApiConfig with
 *          the SDK ServicesContainer. Called once in SampleServlet.init().
 * sdk: globalpayments-sdk (GpApiConfig, ServicesContainer, Channel, Environment)
 */
public class Config {

    public static void configure() throws ServletException {
        Dotenv dotenv = Dotenv.load();

        String appId = dotenv.get("GP_APP_ID", "");
        String appKey = dotenv.get("GP_APP_KEY", "");

        if (appId.isEmpty() || appKey.isEmpty()) {
            throw new ServletException(
                "Missing required environment variables: GP_APP_ID, GP_APP_KEY. " +
                "Copy .env.example to .env and fill in your sandbox credentials.");
        }

        String envStr = dotenv.get("GP_API_ENVIRONMENT", "sandbox").toLowerCase();
        Environment environment = "production".equals(envStr)
            ? Environment.PRODUCTION
            : Environment.TEST;

        GpApiConfig config = new GpApiConfig();
        config.setAppId(appId);
        config.setAppKey(appKey);
        config.setEnvironment(environment);
        config.setChannel(Channel.CardNotPresent);
        config.setCountry(dotenv.get("GP_COUNTRY", "US"));

        // Do NOT set transactionProcessingAccountName — SDK auto-detects from credentials.
        try {
            ServicesContainer.configureService(config);
        } catch (Exception e) {
            throw new ServletException("Failed to configure GP API: " + e.getMessage(), e);
        }
    }
}

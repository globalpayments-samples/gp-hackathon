package com.globalpayments.sample;

import com.global.api.ServicesContainer;
import com.global.api.entities.enums.Channel;
import com.global.api.entities.enums.Environment;
import com.global.api.serviceConfigs.GpApiConfig;

public final class Config {
    private Config() {}

    public static void configure() throws Exception {
        GpApiConfig config = new GpApiConfig();
        config.setAppId(System.getenv("GP_APP_ID"));
        config.setAppKey(System.getenv("GP_APP_KEY"));
        config.setEnvironment("production".equalsIgnoreCase(System.getenv("GP_API_ENVIRONMENT"))
            ? Environment.PRODUCTION
            : Environment.TEST);
        config.setChannel(Channel.CardNotPresent);
        config.setCountry(System.getenv().getOrDefault("GP_COUNTRY", "US"));
        ServicesContainer.configureService(config);
    }
}

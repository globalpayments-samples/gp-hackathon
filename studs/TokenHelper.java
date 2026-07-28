package com.globalpayments.sample;

import com.global.api.entities.enums.Environment;
import com.global.api.entities.gpApi.entities.AccessTokenInfo;
import com.global.api.serviceConfigs.GpApiConfig;
import com.global.api.services.GpApiService;
import io.github.cdimascio.dotenv.Dotenv;
import org.json.JSONObject;

/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 * sdk: globalpayments-sdk (GpApiConfig, GpApiService)
 */
public class TokenHelper {

    private static final Dotenv dotenv = Dotenv.load();

    public static JSONObject generateAccessToken() throws Exception {
        String appId  = dotenv.get("GP_APP_ID");
        String appKey = dotenv.get("GP_APP_KEY");
        String envStr = dotenv.get("GP_API_ENVIRONMENT", "sandbox").toLowerCase();

        GpApiConfig config = new GpApiConfig();
        config.setAppId(appId);
        config.setAppKey(appKey);
        config.setEnvironment("production".equals(envStr) ? Environment.PRODUCTION : Environment.TEST);
        config.setCountry(dotenv.get("GP_COUNTRY", "US"));
        config.setPermissions(new String[]{"PMT_POST_Create_Single"});

        AccessTokenInfo response = GpApiService.generateTransactionKey(config);

        JSONObject result = new JSONObject();
        result.put("accessToken", response.getAccessToken());
        result.put("environment", envStr);
        return result;
    }
}

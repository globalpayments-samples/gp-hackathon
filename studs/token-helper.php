<?php

declare(strict_types=1);

/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 * sdk: globalpayments/php-sdk (GpApiConfig, GpApiService)
 */

use GlobalPayments\Api\Entities\Enums\Environment;
use GlobalPayments\Api\ServiceConfigs\Gateways\GpApiConfig;
use GlobalPayments\Api\Services\GpApiService;

/**
 * Generates a short-lived access token for client-side tokenization.
 * The browser token is restricted to PMT_POST_Create_Single —
 * the Drop-In UI uses it to tokenize the card; the server never sees raw PAN.
 *
 * @return array{accessToken: string, environment: string}
 * @throws \GlobalPayments\Api\Entities\Exceptions\ApiException on SDK or API failure
 */
function generateAccessToken(): array
{
    $config              = new GpApiConfig();
    $config->appId       = $_ENV['GP_APP_ID'];
    $config->appKey      = $_ENV['GP_APP_KEY'];
    $config->environment = (strtolower($_ENV['GP_API_ENVIRONMENT'] ?? 'sandbox') === 'production')
        ? Environment::PRODUCTION
        : Environment::TEST;
    $config->country     = $_ENV['GP_COUNTRY'] ?? 'US';
    $config->permissions = ['PMT_POST_Create_Single'];

    $response = GpApiService::generateTransactionKey($config);

    return [
        'accessToken' => $response->accessToken,
        'environment' => strtolower($_ENV['GP_API_ENVIRONMENT'] ?? 'sandbox'),
    ];
}

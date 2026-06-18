<?php

declare(strict_types=1);

/**
 * layer: baseplate
 * purpose: Configuration Manager — loads environment variables and registers
 *          a GpApiConfig with the SDK ServicesContainer.
 * sdk: globalpayments/php-sdk (GpApiConfig, ServicesContainer, Channel, Environment)
 * reference: dispute-management/php/sdk-config.php
 */

use Dotenv\Dotenv;
use GlobalPayments\Api\Entities\Enums\Channel;
use GlobalPayments\Api\Entities\Enums\Environment;
use GlobalPayments\Api\ServiceConfigs\Gateways\GpApiConfig;
use GlobalPayments\Api\ServicesContainer;

$REQUIRED_VARS = ['GP_APP_ID', 'GP_APP_KEY'];

function missingVars(): array
{
    global $REQUIRED_VARS;
    return array_filter($REQUIRED_VARS, static fn($v) => empty($_ENV[$v]));
}

/**
 * Loads .env, validates required vars, builds GpApiConfig, and registers it
 * with ServicesContainer. Call once at application startup before any SDK use.
 */
function configureGpApi(): void
{
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();

    $missing = missingVars();
    if (!empty($missing)) {
        http_response_code(500);
        echo json_encode([
            'error' => [
                'type'    => 'ConfigurationError',
                'message' => 'Missing required environment variables: ' . implode(', ', $missing) .
                             '. Copy .env.example to .env and fill in your sandbox credentials.',
                'status'  => 500,
            ],
        ]);
        exit;
    }

    $config              = new GpApiConfig();
    $config->appId       = $_ENV['GP_APP_ID'];
    $config->appKey      = $_ENV['GP_APP_KEY'];
    $config->channel     = Channel::CardNotPresent;
    $config->environment = (strtolower($_ENV['GP_API_ENVIRONMENT'] ?? 'sandbox') === 'production')
        ? Environment::PRODUCTION
        : Environment::TEST;
    $config->country     = $_ENV['GP_COUNTRY'] ?? 'US';

    // Do NOT set transactionProcessingAccountName — SDK auto-detects from credentials.

    ServicesContainer::configureService($config);
}

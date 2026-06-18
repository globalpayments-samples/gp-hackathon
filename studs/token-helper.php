<?php

declare(strict_types=1);

/**
 * layer: stud
 * purpose: Tokenization Utility — mints the scoped access token the frontend
 *          Hosted Fields library needs to tokenize card data without raw PAN
 *          ever touching this server.
 *
 * Implementation: direct cURL REST call (not PHP SDK).
 * The PHP SDK does not expose a clean path for the PMT_POST_Create_Single
 * permission scope required by the Drop-In UI. All four GP-Projects language
 * implementations use direct REST for this step.
 *
 * Reference: online-card-payments/php/get-access-token.php
 * Protocol:  POST /ucp/accesstoken with SHA-512(nonce + appKey) secret
 *            and X-GP-Version: 2021-03-22 header.
 */

/**
 * Generates a short-lived access token for client-side tokenization.
 * The browser token is restricted to PMT_POST_Create_Single —
 * the Drop-In UI uses it to tokenize the card; the server never sees raw PAN.
 *
 * @return array{accessToken: string, environment: string}
 * @throws RuntimeException on cURL failure or non-200 API response
 */
function generateAccessToken(): array
{
    $appId   = $_ENV['GP_APP_ID'];
    $appKey  = $_ENV['GP_APP_KEY'];
    $env     = strtolower($_ENV['GP_API_ENVIRONMENT'] ?? 'sandbox');

    $nonce   = bin2hex(random_bytes(16));
    $secret  = hash('sha512', $nonce . $appKey);

    $endpoint = $env === 'production'
        ? 'https://apis.globalpay.com/ucp/accesstoken'
        : 'https://apis.sandbox.globalpay.com/ucp/accesstoken';

    $payload = json_encode([
        'app_id'           => $appId,
        'nonce'            => $nonce,
        'secret'           => $secret,
        'grant_type'       => 'client_credentials',
        'seconds_to_expire'=> 600,
        'permissions'      => ['PMT_POST_Create_Single'],
    ]);

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-GP-Version: 2021-03-22',
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_ENCODING       => '',
    ]);

    $response  = curl_exec($ch);
    $httpCode  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new RuntimeException('Connection error: ' . $curlError);
    }

    $data = json_decode((string) $response, true);

    if ($httpCode !== 200 || empty($data['token'])) {
        $msg = $data['error_description'] ?? $data['message'] ?? 'Failed to generate access token';
        throw new RuntimeException($msg);
    }

    return [
        'accessToken' => $data['token'],
        'environment' => $env,
    ];
}

<?php
declare(strict_types=1);

use GlobalPayments\Api\Entities\Enums\ExemptStatus;
use GlobalPayments\Api\Entities\ThreeDSecure;
use GlobalPayments\Api\PaymentMethods\CreditCardData;

// Exemptions that can be requested in the authorization message alone, with
// no 3D Secure authentication first. The issuer decides whether to apply it.
const GP_EXEMPTIONS = [
    'low-value' => ExemptStatus::LOW_VALUE,
    'transaction-risk-analysis' => ExemptStatus::TRANSACTION_RISK_ANALYSIS,
    'trusted-merchant' => ExemptStatus::TRUSTED_MERCHANT,
    'secure-corporate-payment' => ExemptStatus::SECURE_CORPORATE_PAYMENT,
];

function gpExemptionString(array $body, string $key): string
{
    if (!isset($body[$key]) || !is_string($body[$key]) || trim($body[$key]) === '') {
        throw new InvalidArgumentException($key . ' is required');
    }
    return trim($body[$key]);
}

function gpExemptionFromBody(array $body): string
{
    $name = gpExemptionString($body, 'exemption');
    if (!array_key_exists($name, GP_EXEMPTIONS)) {
        throw new InvalidArgumentException('exemption must be one of: ' . implode(', ', array_keys(GP_EXEMPTIONS)));
    }
    return GP_EXEMPTIONS[$name];
}

function gpChargeWithExemption(array $body): array
{
    $exemption = gpExemptionFromBody($body);
    $card = new CreditCardData();
    $card->token = gpExemptionString($body, 'token');
    $card->threeDSecure = new ThreeDSecure();
    $card->threeDSecure->exemptStatus = $exemption;
    $response = $card->charge($body['amount'] ?? '10.00')->withCurrency($body['currency'] ?? 'EUR')->execute();
    return [
        'transactionId' => $response->transactionId ?? null,
        'responseCode' => $response->responseCode ?? null,
        'responseMessage' => $response->responseMessage ?? null,
        'authorizationCode' => $response->authorizationCode ?? null,
        'exemptionRequested' => $exemption,
    ];
}

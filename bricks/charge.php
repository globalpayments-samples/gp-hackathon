<?php

declare(strict_types=1);

/**
 * layer: brick
 * purpose: Charge — single-step authorization and capture of a tokenized card.
 * sdk: globalpayments/php-sdk (CreditCardData)
 */

use GlobalPayments\Api\PaymentMethods\CreditCardData;

/**
 * @param array{token: string, amount: string|float, currency?: string} $params
 */
function charge(array $params): array
{
    $card        = new CreditCardData();
    $card->token = $params['token'];
    $transaction = $card
        ->charge($params['amount'] ?? '29.99')
        ->withCurrency($params['currency'] ?? 'USD')
        ->execute();

    return [
        'transactionId'     => $transaction->transactionId,
        'status'            => $transaction->responseMessage ?? $transaction->transactionStatus ?? null,
        'responseCode'      => $transaction->responseCode,
        'authorizationCode' => $transaction->authorizationCode ?? null,
    ];
}

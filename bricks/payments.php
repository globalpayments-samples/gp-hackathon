<?php

declare(strict_types=1);

/**
 * layer: brick
 * purpose: Atomic SDK payment operations — Charge (single-step auth+capture),
 *          Authorize (hold funds), Capture (settle a prior authorization).
 *          Isolated, stateless functions with predictable inputs and outputs.
 *
 * sdk: globalpayments/php-sdk (CreditCardData, Transaction)
 * reference: online-card-payments/php/process-sale.php
 *            save-and-reuse-payment-methods/php/PaymentUtils.php
 */

use GlobalPayments\Api\PaymentMethods\CreditCardData;
use GlobalPayments\Api\Entities\Transaction;

/**
 * Extracts a normalized summary array from an SDK Transaction response.
 */
function summarize(Transaction $transaction): array
{
    return [
        'transactionId'     => $transaction->transactionId,
        'status'            => $transaction->responseMessage ?? $transaction->transactionStatus ?? null,
        'responseCode'      => $transaction->responseCode,
        'authorizationCode' => $transaction->authorizationCode ?? null,
    ];
}

/**
 * Builds a CreditCardData instance from a single-use payment token.
 */
function cardFromToken(string $token): CreditCardData
{
    $card        = new CreditCardData();
    $card->token = $token;
    return $card;
}

/**
 * Single-step authorization and capture of a tokenized card.
 *
 * @param array{token: string, amount: string|float, currency?: string} $params
 */
function charge(array $params): array
{
    $transaction = cardFromToken($params['token'])
        ->charge($params['amount'] ?? '29.99')
        ->withCurrency($params['currency'] ?? 'USD')
        ->execute();

    return summarize($transaction);
}

/**
 * Places a hold on funds without capturing them.
 *
 * @param array{token: string, amount: string|float, currency?: string} $params
 */
function authorize(array $params): array
{
    $transaction = cardFromToken($params['token'])
        ->authorize($params['amount'] ?? '29.99')
        ->withCurrency($params['currency'] ?? 'USD')
        ->execute();

    return summarize($transaction);
}

/**
 * Captures a previously authorized transaction by id.
 *
 * @param array{transactionId: string, amount: string|float|null, currency?: string} $params
 */
function capture(array $params): array
{
    $builder = Transaction::fromId($params['transactionId'])
        ->capture($params['amount'] ?? null);

    if (!empty($params['currency'])) {
        $builder->withCurrency($params['currency']);
    }

    return summarize($builder->execute());
}

<?php

declare(strict_types=1);

/**
 * layer: brick
 * purpose: Capture — settles a previously authorized transaction by id.
 * sdk: globalpayments/php-sdk (Transaction)
 */

use GlobalPayments\Api\Entities\Transaction;

/**
 * @param array{transactionId: string, amount: string|float|null, currency?: string} $params
 */
function capture(array $params): array
{
    $builder = Transaction::fromId($params['transactionId'])
        ->capture($params['amount'] ?? null);

    if (!empty($params['currency'])) {
        $builder->withCurrency($params['currency']);
    }

    $transaction = $builder->execute();

    return [
        'transactionId'     => $transaction->transactionId,
        'status'            => $transaction->responseMessage ?? $transaction->transactionStatus ?? null,
        'responseCode'      => $transaction->responseCode,
        'authorizationCode' => $transaction->authorizationCode ?? null,
    ];
}

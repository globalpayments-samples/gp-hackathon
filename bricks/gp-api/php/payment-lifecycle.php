<?php
declare(strict_types=1);

use GlobalPayments\Api\Entities\Transaction;
use GlobalPayments\Api\PaymentMethods\CreditCardData;
use GlobalPayments\Api\Services\ReportingService;

function requiredString(array $body, string $key): string
{
    if (!isset($body[$key]) || !is_string($body[$key]) || trim($body[$key]) === '') {
        throw new InvalidArgumentException($key . ' is required');
    }
    return trim($body[$key]);
}

function gpCardFromBody(array $body): CreditCardData
{
    $card = new CreditCardData();
    $card->token = requiredString($body, 'token');
    return $card;
}

function gpSerialize(mixed $response): array
{
    return [
        'transactionId' => $response->transactionId ?? null,
        'responseCode' => $response->responseCode ?? null,
        'responseMessage' => $response->responseMessage ?? null,
        'authorizationCode' => $response->authorizationCode ?? null,
    ];
}

function gpVerifyToken(array $body): array
{
    return gpSerialize(gpCardFromBody($body)->verify()->withCurrency($body['currency'] ?? 'USD')->execute());
}

function gpAuthorizePayment(array $body): array
{
    return gpSerialize(gpCardFromBody($body)->authorize($body['amount'] ?? '29.99')->withCurrency($body['currency'] ?? 'USD')->execute());
}

function gpCapturePayment(array $body): array
{
    return gpSerialize(Transaction::fromId(requiredString($body, 'transactionId'))->capture($body['amount'] ?? null)->execute());
}

function gpRefundPayment(array $body): array
{
    return gpSerialize(Transaction::fromId(requiredString($body, 'transactionId'))->refund($body['amount'] ?? null)->execute());
}

function gpReversePayment(array $body): array
{
    return gpSerialize(Transaction::fromId(requiredString($body, 'transactionId'))->reverse($body['amount'] ?? null)->execute());
}

function gpPaymentStatus(array $body): array
{
    return gpSerialize(ReportingService::transactionDetail(requiredString($body, 'transactionId'))->execute());
}

<?php
declare(strict_types=1);

use GlobalPayments\Api\Entities\Transaction;
use GlobalPayments\Api\PaymentMethods\CreditCardData;
use GlobalPayments\Api\Services\ReportingService;

function tapiRequiredString(array $body, string $key): string
{
    if (!isset($body[$key]) || !is_string($body[$key]) || trim($body[$key]) === '') {
        throw new InvalidArgumentException($key . ' is required');
    }
    return trim($body[$key]);
}

function tapiCardFromBody(array $body): CreditCardData
{
    $card = new CreditCardData();
    if (isset($body['token'])) {
        $card->token = tapiRequiredString($body, 'token');
        return $card;
    }
    $card->number = tapiRequiredString($body, 'number');
    $card->expMonth = tapiRequiredString($body, 'expMonth');
    $card->expYear = tapiRequiredString($body, 'expYear');
    $card->cvn = $body['cvn'] ?? null;
    return $card;
}

function tapiSerialize(mixed $response): array
{
    $result = [
        'transactionId' => $response->transactionId ?? null,
        'responseCode' => $response->responseCode ?? null,
        'responseMessage' => $response->responseMessage ?? null,
        'authorizationCode' => $response->authorizationCode ?? null,
    ];
    if (count(array_filter($result, static fn(mixed $value): bool => $value !== null && $value !== '')) === 0) {
        throw new RuntimeException('TAPI returned an empty transaction response');
    }
    return $result;
}

function tapiSale(array $body): array
{
    $idempotencyKey = tapiIdempotencyKey($body);
    if ($idempotencyKey === null) throw new InvalidArgumentException('idempotencyKey is required');
    return tapiSerialize(
        tapiCardFromBody($body)
            ->charge($body['amount'] ?? '29.99')
            ->withCurrency($body['currency'] ?? 'USD')
            ->withClientTransactionId($idempotencyKey)
            ->execute()
    );
}

function tapiAuthorize(array $body): array
{
    $idempotencyKey = tapiIdempotencyKey($body);
    if ($idempotencyKey === null) throw new InvalidArgumentException('idempotencyKey is required');
    return tapiSerialize(
        tapiCardFromBody($body)
            ->authorize($body['amount'] ?? '29.99')
            ->withCurrency($body['currency'] ?? 'USD')
            ->withClientTransactionId($idempotencyKey)
            ->execute()
    );
}

function tapiCapture(array $body): array
{
    return tapiSerialize(Transaction::fromId(tapiRequiredString($body, 'transactionId'))->capture($body['amount'] ?? null)->execute());
}

function tapiVoid(array $body): array
{
    return tapiSerialize(Transaction::fromId(tapiRequiredString($body, 'transactionId'))->void()->execute());
}

function tapiRefund(array $body): array
{
    return tapiSerialize(Transaction::fromId(tapiRequiredString($body, 'transactionId'))->refund($body['amount'] ?? null)->execute());
}

function tapiStatus(array $body): array
{
    return tapiSerialize(ReportingService::transactionDetail(tapiRequiredString($body, 'transactionId'))->execute());
}

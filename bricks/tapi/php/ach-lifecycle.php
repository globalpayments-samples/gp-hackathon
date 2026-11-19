<?php
declare(strict_types=1);

use GlobalPayments\Api\Entities\Enums\PaymentMethodType;
use GlobalPayments\Api\Entities\Enums\SecCode;
use GlobalPayments\Api\Entities\Transaction;
use GlobalPayments\Api\Entities\TransactionApi\TransactionApiData;
use GlobalPayments\Api\PaymentMethods\ECheck;

// How the consumer authorised the debit. POP is left out, it is for in-person checks.
const TAPI_ACH_ENTRY_CLASSES = [
    'WEB' => SecCode::WEB,
    'PPD' => SecCode::PPD,
    'CCD' => SecCode::CCD,
    'TEL' => SecCode::TEL,
];

// The SDK sends accountType as given on a sale and defaults it to "0.00" on a
// linked refund, so the values TAPI expects are set here and never left out.
const TAPI_ACH_ACCOUNT_TYPES = [
    'checking' => 'Checking',
    'savings' => 'Savings',
];

function tapiAchString(array $body, string $key): string
{
    if (!isset($body[$key]) || !is_string($body[$key]) || trim($body[$key]) === '') {
        throw new InvalidArgumentException($key . ' is required');
    }
    return trim($body[$key]);
}

function tapiAchDigits(array $body, string $key, int $min, int $max): string
{
    $value = tapiAchString($body, $key);
    if (!preg_match('/^\d{' . $min . ',' . $max . '}$/', $value)) {
        throw new InvalidArgumentException($key . ' must be ' . ($min === $max ? $min : $min . ' to ' . $max) . ' digits');
    }
    return $value;
}

// No default amount: this moves money out of a bank account.
function tapiAchAmount(array $body): string
{
    $amount = $body['amount'] ?? null;
    if (!is_string($amount) && !is_int($amount) && !is_float($amount)) {
        throw new InvalidArgumentException('amount is required');
    }
    $amount = trim((string) $amount);
    if (!preg_match('/^\d+(\.\d{1,2})?$/', $amount) || (float) $amount <= 0) {
        throw new InvalidArgumentException('amount must be a positive number with up to two decimals');
    }
    return number_format((float) $amount, 2, '.', '');
}

function tapiAchAccountType(array $body): string
{
    $name = strtolower(tapiAchString($body, 'accountType'));
    if (!array_key_exists($name, TAPI_ACH_ACCOUNT_TYPES)) {
        throw new InvalidArgumentException('accountType must be one of: ' . implode(', ', array_keys(TAPI_ACH_ACCOUNT_TYPES)));
    }
    return TAPI_ACH_ACCOUNT_TYPES[$name];
}

function tapiAchEntryClass(array $body): string
{
    $name = strtoupper(isset($body['entryClass']) ? tapiAchString($body, 'entryClass') : 'WEB');
    if (!array_key_exists($name, TAPI_ACH_ENTRY_CLASSES)) {
        throw new InvalidArgumentException('entryClass must be one of: ' . implode(', ', array_keys(TAPI_ACH_ENTRY_CLASSES)));
    }
    return TAPI_ACH_ENTRY_CLASSES[$name];
}

function tapiAchRequireUs(): void
{
    if (strtoupper((string) getenv('TAPI_REGION')) !== 'US') {
        throw new RuntimeException('TAPI ACH in this sample is US only, set TAPI_REGION=US');
    }
}

function tapiAchCheckNumber(array $body): ?string
{
    return isset($body['checkNumber']) ? tapiAchDigits($body, 'checkNumber', 1, 15) : null;
}

function tapiAchSerialize(mixed $response): array
{
    $result = [
        'transactionId' => $response->transactionId ?? null,
        'responseCode' => $response->responseCode ?? null,
        'responseMessage' => $response->responseMessage ?? null,
    ];
    if (count(array_filter($result, static fn(mixed $value): bool => $value !== null && $value !== '')) === 0) {
        throw new RuntimeException('TAPI returned an empty transaction response');
    }
    return $result;
}

// Built apart from execute() so the contract test can read the request the SDK
// would send. The SDK only sends the entry class when transaction data is set.
function tapiAchSaleBuilder(array $body)
{
    $check = new ECheck();
    $check->accountType = tapiAchAccountType($body);
    $check->accountNumber = tapiAchDigits($body, 'accountNumber', 4, 17);
    $check->routingNumber = tapiAchDigits($body, 'routingNumber', 9, 9);
    $check->checkNumber = tapiAchCheckNumber($body);
    return $check->charge(tapiAchAmount($body))
        ->withCurrency('USD')
        ->withEntryClass(tapiAchEntryClass($body))
        ->withTransactionData(new TransactionApiData());
}

function tapiAchRefundBuilder(array $body)
{
    $check = new ECheck();
    $check->accountType = tapiAchAccountType($body);
    $check->checkNumber = tapiAchCheckNumber($body);
    return Transaction::fromId(tapiAchString($body, 'transactionId'), null, PaymentMethodType::ACH)
        ->refund(tapiAchAmount($body))
        ->withBankTransferData($check)
        ->withEntryClass(tapiAchEntryClass($body));
}

function tapiAchSale(array $body): array
{
    tapiAchRequireUs();
    return tapiAchSerialize(tapiAchSaleBuilder($body)->execute());
}

function tapiAchRefund(array $body): array
{
    tapiAchRequireUs();
    return tapiAchSerialize(tapiAchRefundBuilder($body)->execute());
}

<?php
$root = dirname(__DIR__);
$source = file_get_contents($root . '/index.php') . file_get_contents($root . '/bricks/tapi/php/ach-lifecycle.php');
foreach (['TransactionApiConfig', 'ECheck', 'withTransactionData', 'withBankTransferData', 'PaymentMethodType::ACH', '/api/ach/sale', '/api/ach/refund', 'TAPI_REGION', 'TAPI returned an empty transaction response'] as $token) {
    if (!str_contains($source, $token)) {
        throw new RuntimeException("Missing $token");
    }
}
if (preg_match('/skapi_|apiSecret\\s*=\\s*[\'"][^\'"]+/', $source)) {
    throw new RuntimeException('Credential literal copied into generated TAPI sample');
}
$fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/ach.json'), true, 512, JSON_THROW_ON_ERROR);
if (($fixture['sale']['routingNumber'] ?? null) !== '021000021' || ($fixture['refund']['transactionId'] ?? null) !== 'CHK_fixture_tapi') {
    throw new RuntimeException('ACH fixture shape changed');
}
// Build each request offline with the SDK's own request builders and check what
// would go to TAPI. Needs composer install.
require_once $root . '/vendor/autoload.php';
require_once $root . '/bricks/tapi/php/ach-lifecycle.php';
$config = new GlobalPayments\Api\ServiceConfigs\Gateways\TransactionApiConfig();
$config->accountCredential = 'fixture';
$config->apiKey = 'fixture';
$config->apiSecret = 'fixture';
$config->country = 'US';
$decode = static fn($request): array => json_decode(json_encode($request->requestBody), true);
$fail = static function (string $message): never {
    throw new RuntimeException($message);
};

if (array_keys(TAPI_ACH_ENTRY_CLASSES) !== ['WEB', 'PPD', 'CCD', 'TEL']) $fail('Offered entry classes changed');
if (TAPI_ACH_ACCOUNT_TYPES !== ['checking' => 'Checking', 'savings' => 'Savings']) $fail('Offered account types changed');

// Sale: checksales, bank details in the check object, entry class and country in the transaction object.
foreach (['checking' => 'Checking', 'savings' => 'Savings'] as $input => $expected) {
    $request = (new GlobalPayments\Api\Builders\RequestBuilder\TransactionApi\TransactionApiAuthorizationRequestBuilder())
        ->buildRequest(tapiAchSaleBuilder(['accountType' => $input] + $fixture['sale']), $config);
    $body = $decode($request);
    if ($request->endpoint !== 'checksales') $fail("ACH sale went to {$request->endpoint}");
    if (($body['check']['account_type'] ?? null) !== $expected) $fail("accountType $input is not sent as $expected");
    if (($body['check']['routing_number'] ?? null) !== '021000021' || ($body['check']['account_number'] ?? null) !== '1234567890' || ($body['check']['check_number'] ?? null) !== '1001') $fail('Bank details missing from the sale request');
    if (($body['payment']['amount'] ?? null) !== '10.00' || ($body['payment']['currency_code'] ?? null) !== '840') $fail('Amount or currency missing from the sale request');
    if (($body['transaction']['entry_class'] ?? null) !== 'WEB') $fail('entry_class missing from the sale request');
}
foreach (['PPD', 'CCD', 'TEL'] as $class) {
    $body = $decode((new GlobalPayments\Api\Builders\RequestBuilder\TransactionApi\TransactionApiAuthorizationRequestBuilder())
        ->buildRequest(tapiAchSaleBuilder(['entryClass' => strtolower($class)] + $fixture['sale']), $config));
    if (($body['transaction']['entry_class'] ?? null) !== $class) $fail("entryClass $class not sent");
}

// Linked refund: checksales/{id}/checkrefunds with the account type and check number, never the SDK's "0.00" default.
$request = (new GlobalPayments\Api\Builders\RequestBuilder\TransactionApi\TransactionApiManagementRequestBuilder())
    ->buildRequest(tapiAchRefundBuilder($fixture['refund']), $config);
$body = $decode($request);
if ($request->endpoint !== 'checksales/CHK_fixture_tapi/checkrefunds') $fail("ACH refund went to {$request->endpoint}");
if (($body['check']['account_type'] ?? null) !== 'Checking' || ($body['check']['check_number'] ?? null) !== '1001') $fail('Refund request is missing the check details');
if (($body['payment']['amount'] ?? null) !== '10.00' || ($body['transaction']['entry_class'] ?? null) !== 'WEB') $fail('Refund amount or entry_class missing');

// Anything outside the offered values is rejected before a gateway call.
$rejected = [
    'routing number too short' => ['routingNumber' => '02100002'],
    'routing number with letters' => ['routingNumber' => '02100002X'],
    'account number too short' => ['accountNumber' => '123'],
    'unknown account type' => ['accountType' => 'credit'],
    'missing account type' => ['accountType' => ''],
    'POP entry class' => ['entryClass' => 'POP'],
    'no amount' => ['amount' => null],
    'zero amount' => ['amount' => '0.00'],
    'three decimals' => ['amount' => '10.123'],
    'negative amount' => ['amount' => '-5.00'],
];
foreach ($rejected as $label => $override) {
    try {
        tapiAchSaleBuilder($override + $fixture['sale']);
        $fail("Sale accepted: $label");
    } catch (InvalidArgumentException) {
    }
}
foreach (['no transaction id' => ['transactionId' => ''], 'no account type' => ['accountType' => ''], 'no amount' => ['amount' => null]] as $label => $override) {
    try {
        tapiAchRefundBuilder($override + $fixture['refund']);
        $fail("Refund accepted: $label");
    } catch (InvalidArgumentException) {
    }
}
echo "contract passed\n";

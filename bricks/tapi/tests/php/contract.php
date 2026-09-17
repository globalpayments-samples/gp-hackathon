<?php
$root = dirname(__DIR__);
$source = file_get_contents($root . '/index.php') . file_get_contents($root . '/bricks/tapi/php/credit-lifecycle.php');
foreach (['TransactionApiConfig', 'CreditCardData', 'Transaction::fromId', 'ReportingService::transactionDetail', 'withClientTransactionId($idempotencyKey)', 'TAPI returned an empty transaction response'] as $token) {
    if (!str_contains($source, $token)) {
        throw new RuntimeException("Missing $token");
    }
}
foreach (["country = getenv('TAPI_REGION')", "apiVersion = getenv('TAPI_API_VERSION') ?: '2021-04-08'"] as $token) {
    if (!str_contains($source, $token)) {
        throw new RuntimeException("Missing TAPI configuration mapping: $token");
    }
}
if (!str_contains($source, 'createUnsafeImmutable(__DIR__)->safeLoad()')) {
    throw new RuntimeException('Generated TAPI PHP app does not load its local .env file');
}
if (preg_match('/skapi_|secretApiKey\\s*=\\s*[\'"][^\'"]+/', $source)) {
    throw new RuntimeException('Credential literal copied into generated TAPI sample');
}
$fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/credit.json'), true, 512, JSON_THROW_ON_ERROR);
if (($fixture['sale']['idempotencyKey'] ?? null) !== 'fixture-idempotency-key') {
    throw new RuntimeException('TAPI fixture shape changed');
}
echo "contract passed\n";

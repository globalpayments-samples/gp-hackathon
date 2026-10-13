<?php
$root = dirname(__DIR__);
$source = file_get_contents($root . '/index.php') . file_get_contents($root . '/bricks/gp-api/php/payment-lifecycle.php');
foreach (['GpApiConfig', 'CreditCardData', 'Transaction::fromId', 'ReportingService::transactionDetail'] as $token) {
    if (!str_contains($source, $token)) {
        throw new RuntimeException("Missing $token");
    }
}
if (str_contains($source, ':operation')) {
    throw new RuntimeException('Generic operation proxy must not be generated');
}
$fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/lifecycle.json'), true, 512, JSON_THROW_ON_ERROR);
if (($fixture['tokenPayment']['token'] ?? null) !== 'single-use-token-from-hosted-fields') {
    throw new RuntimeException('Lifecycle fixture shape changed');
}
echo "contract passed\n";

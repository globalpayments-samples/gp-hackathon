<?php
$root = dirname(__DIR__);
$source = file_get_contents($root . '/index.php') . file_get_contents($root . '/bricks/gp-api/php/sca-exemption.php');
foreach (['GpApiConfig', 'CreditCardData', 'ThreeDSecure', 'exemptStatus', '/api/payments/charge-with-exemption', 'GP_COUNTRY'] as $token) {
    if (!str_contains($source, $token)) {
        throw new RuntimeException("Missing $token");
    }
}
if (str_contains($source, 'SCA_DELEGATION')) {
    throw new RuntimeException('SCA delegation is not an authorization-message exemption');
}
$fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/sca-exemption.json'), true, 512, JSON_THROW_ON_ERROR);
if (($fixture['exemptCharge']['exemption'] ?? null) !== 'low-value') {
    throw new RuntimeException('Exemption fixture shape changed');
}
// Build each authorization request offline with the SDK's own request builder
// and check the exemption is in it. Needs composer install.
require_once $root . '/vendor/autoload.php';
require_once $root . '/bricks/gp-api/php/sca-exemption.php';
$config = new GlobalPayments\Api\ServiceConfigs\Gateways\GpApiConfig();
$config->channel = GlobalPayments\Api\Entities\Enums\Channel::CardNotPresent;
$config->country = 'IE';
$config->accessTokenInfo = new GlobalPayments\Api\Entities\GpApi\AccessTokenInfo();
$config->accessTokenInfo->transactionProcessingAccountName = 'fixture';
$expected = [
    'low-value' => 'LOW_VALUE',
    'transaction-risk-analysis' => 'TRANSACTION_RISK_ANALYSIS',
    'trusted-merchant' => 'TRUSTED_MERCHANT',
    'secure-corporate-payment' => 'SECURE_CORPORATE_PAYMENT',
];
if (array_keys(GP_EXEMPTIONS) !== array_keys($expected)) {
    throw new RuntimeException('Offered exemptions changed');
}
foreach ($expected as $name => $status) {
    if (gpExemptionFromBody(['exemption' => $name]) !== $status) {
        throw new RuntimeException("Exemption $name does not map to $status");
    }
    $card = new GlobalPayments\Api\PaymentMethods\CreditCardData();
    $card->token = $fixture['exemptCharge']['token'];
    $card->threeDSecure = new GlobalPayments\Api\Entities\ThreeDSecure();
    $card->threeDSecure->exemptStatus = gpExemptionFromBody(['exemption' => $name]);
    $request = (new GlobalPayments\Api\Builders\RequestBuilder\GpApi\GpApiAuthorizationRequestBuilder())
        ->buildRequest($card->charge('10.00')->withCurrency('EUR'), $config);
    $body = json_decode(json_encode($request->requestBody), true);
    if (($body['type'] ?? null) !== 'SALE' || ($body['payment_method']['authentication']['three_ds']['exempt_status'] ?? null) !== $status) {
        throw new RuntimeException("Request for $name does not carry exempt_status $status");
    }
}
try {
    gpExemptionFromBody(['exemption' => 'sca-delegation']);
    throw new LogicException('sca-delegation was accepted');
} catch (InvalidArgumentException) {
}
echo "contract passed\n";

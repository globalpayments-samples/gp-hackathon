<?php
declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use GlobalPayments\Api\Entities\Enums\Channel;
use GlobalPayments\Api\Entities\Enums\Environment;
use GlobalPayments\Api\ServiceConfigs\Gateways\GpApiConfig;
use GlobalPayments\Api\ServicesContainer;

{{ IMPORTS }}

$configRequired = {{ CONFIG_ARRAY }};
$routes = [];

function failJson(int $status, string $message, mixed $details = null): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['error' => ['message' => $message, 'details' => $details]]);
    exit;
}

function missingCredentials(): array
{
    global $configRequired;
    return array_values(array_filter($configRequired, static fn(string $name): bool => getenv($name) === false || getenv($name) === ''));
}

function requireLiveCredentials(): void
{
    $missing = missingCredentials();
    if ($missing !== []) failJson(503, 'Live call blocked: missing ' . implode(', ', $missing));
}

function configureGateway(): void
{
    requireLiveCredentials();
    $config = new GpApiConfig();
    $config->appId = getenv('GP_APP_ID');
    $config->appKey = getenv('GP_APP_KEY');
    $config->channel = Channel::CardNotPresent;
    $config->environment = strtolower((string) getenv('GP_API_ENVIRONMENT')) === 'production'
        ? Environment::PRODUCTION
        : Environment::TEST;
    $config->country = getenv('GP_COUNTRY') ?: 'US';
    ServicesContainer::configureService($config);
}

function addRoute(string $method, string $path, callable $handler): void
{
    global $routes;
    $key = $method . ' ' . $path;
    if (isset($routes[$key])) throw new RuntimeException('Duplicate route registered: ' . $key);
    $routes[$key] = $handler;
}

function requestBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    return is_array($decoded) ? $decoded : [];
}

{{ ROUTE_HANDLERS }}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && $path === '/health') {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok', 'platform' => 'gp-api']);
    exit;
}

$key = ($_SERVER['REQUEST_METHOD'] ?? 'GET') . ' ' . $path;
if (!isset($routes[$key])) failJson(404, 'Route not found');

try {
    configureGateway();
    $result = $routes[$key](requestBody());
    header('Content-Type: application/json');
    echo json_encode($result);
} catch (Throwable $error) {
    failJson($error instanceof InvalidArgumentException ? 400 : 502, $error->getMessage());
}

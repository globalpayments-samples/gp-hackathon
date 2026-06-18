<?php

declare(strict_types=1);

/**
 * {{ PROJECT_NAME }} — generated standalone sample project.
 * Composed by the Builder from the Global Payments component catalog.
 * Every route below is signal: one handler per selected component.
 * The core/ files hide SDK setup and error handling boilerplate.
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/core/config.php';
require_once __DIR__ . '/core/error-handler.php';

{{ IMPORTS }}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

configureGpApi();

$method = $_SERVER['REQUEST_METHOD'];
$uri    = strtok($_SERVER['REQUEST_URI'], '?');
$uri    = rtrim($uri, '/') ?: '/';

// Health check — no SDK required.
if ($method === 'GET' && $uri === '/health') {
    echo json_encode(['status' => 'ok']);
    exit;
}

{{ ROUTE_HANDLERS }}

// 404 — no component handled this route.
http_response_code(404);
echo json_encode([
    'error' => [
        'type'    => 'NotFound',
        'message' => "No route matched {$method} {$uri}",
        'status'  => 404,
    ],
]);

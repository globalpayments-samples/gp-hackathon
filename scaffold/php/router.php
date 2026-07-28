<?php

declare(strict_types=1);

/**
 * PHP built-in server router for {{ PROJECT_NAME }}.
 *
 * Responsibilities:
 *   1. Serve static files from public/ (mirrors Express.static('public')).
 *   2. Respond to GET /health directly (no app bootstrap needed).
 *   3. Route all other requests to index.php where component route handlers live.
 *
 * Usage: php -S 0.0.0.0:3000 router.php
 */

$uri = strtok($_SERVER['REQUEST_URI'], '?');
$uri = rtrim($uri, '/') ?: '/';

// Serve static files from public/ — maps /styles.css → public/styles.css.
$publicFile = __DIR__ . '/public' . $uri;
if (is_file($publicFile)) {
    $ext = strtolower(pathinfo($publicFile, PATHINFO_EXTENSION));
    $mimeTypes = [
        'html' => 'text/html',
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'png'  => 'image/png',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
    ];
    header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
    readfile($publicFile);
    return true;
}

// Serve index.html for root requests.
if ($uri === '/') {
    header('Content-Type: text/html');
    readfile(__DIR__ . '/public/index.html');
    return true;
}

// Route all other requests to index.php (the generated application).
require __DIR__ . '/index.php';
return true;

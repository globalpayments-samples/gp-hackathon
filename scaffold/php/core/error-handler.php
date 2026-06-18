<?php

declare(strict_types=1);

/**
 * layer: baseplate
 * purpose: Unified error handler — catches ApiException / GatewayException style
 *          SDK errors and normalizes them into structured JSON error responses.
 * sdk: globalpayments/php-sdk (exception hierarchy)
 * reference: online-card-payments/php/process-sale.php catch blocks
 */

use GlobalPayments\Api\Entities\Exceptions\ApiException;
use GlobalPayments\Api\Entities\Exceptions\BuilderException;
use GlobalPayments\Api\Entities\Exceptions\ConfigurationException;
use GlobalPayments\Api\Entities\Exceptions\GatewayException;

/**
 * Sends a structured JSON error response and exits.
 * Call from catch blocks in route handlers.
 *
 * @param Throwable $e        The caught exception.
 * @param int|null  $override HTTP status override; auto-detected if null.
 */
function sendError(Throwable $e, ?int $override = null): void
{
    $isSdkError = $e instanceof ApiException
               || $e instanceof GatewayException
               || $e instanceof BuilderException
               || $e instanceof ConfigurationException;

    $status = $override ?? ($isSdkError ? 502 : 500);

    http_response_code($status);
    echo json_encode([
        'error' => [
            'type'    => (new ReflectionClass($e))->getShortName(),
            'message' => $e->getMessage() ?: 'Unexpected error',
            'status'  => $status,
        ],
    ]);
    exit;
}

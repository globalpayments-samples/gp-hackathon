<?php
declare(strict_types=1);

function tapiIdempotencyKey(array $body): ?string
{
    if (!isset($body['idempotencyKey'])) return null;
    if (!is_string($body['idempotencyKey']) || trim($body['idempotencyKey']) === '') {
        throw new InvalidArgumentException('idempotencyKey must be a non-empty string when provided');
    }
    return trim($body['idempotencyKey']);
}

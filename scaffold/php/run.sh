#!/usr/bin/env bash
set -e

composer install --no-interaction --prefer-dist

PORT="${PORT:-3000}"
echo "Starting {{ PROJECT_TITLE }} on http://localhost:${PORT}"
php -S 0.0.0.0:"${PORT}" router.php

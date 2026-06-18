<?php

declare(strict_types=1);

/**
 * Smoke test for the generated {{ PROJECT_NAME }} PHP project.
 *
 * Mirrors scaffold/node/tests/project.test.js:
 *   - Skips when required env vars are missing (no sandbox credentials needed
 *     for the structural checks).
 *   - Skips if index.php still contains unfilled slot markers (Builder
 *     must run before tests are meaningful).
 *   - Starts the built-in PHP server on an ephemeral port, verifies /health,
 *     the root page, and the GP logo asset.
 */

use PHPUnit\Framework\TestCase;

class ProjectTest extends TestCase
{
    private static int $port;
    private static ?int $pid = null;

    public static function setUpBeforeClass(): void
    {
        $dotenvFile = __DIR__ . '/../.env';
        if (file_exists($dotenvFile)) {
            $lines = file($dotenvFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (str_starts_with(trim($line), '#')) continue;
                [$key, $value] = explode('=', $line, 2) + [1 => ''];
                $_ENV[trim($key)] = trim($value);
            }
        }

        // Check for unfilled slot markers in index.php.
        $indexSrc = file_get_contents(__DIR__ . '/../index.php');
        if (preg_match('/\{\{\s*[A-Z0-9_]+\s*\}\}/', $indexSrc)) {
            self::markTestSkipped(
                'index.php contains unfilled template slots — run the Builder first.'
            );
        }

        // Skip if sandbox credentials are absent.
        if (empty($_ENV['GP_APP_ID']) || empty($_ENV['GP_APP_KEY'])) {
            self::markTestSkipped(
                'Set GP_APP_ID and GP_APP_KEY in .env to run sandbox smoke tests.'
            );
        }

        // Start built-in server on a random free port.
        self::$port = self::freePort();
        $cmd = sprintf(
            'php -S 0.0.0.0:%d %s/router.php > /dev/null 2>&1 & echo $!',
            self::$port,
            escapeshellarg(__DIR__ . '/..')
        );
        $output = shell_exec($cmd);
        self::$pid = (int) trim((string) $output);
        usleep(500_000); // Give the server 0.5 s to start.
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$pid !== null) {
            posix_kill(self::$pid, SIGTERM);
        }
    }

    public function testHealthEndpointReturnsOk(): void
    {
        $response = $this->get('/health');
        $this->assertSame(200, $response['status']);
        $body = json_decode($response['body'], true);
        $this->assertSame('ok', $body['status'] ?? null);
    }

    public function testRootServesCheckoutPage(): void
    {
        $response = $this->get('/');
        $this->assertSame(200, $response['status']);
        $this->assertStringContainsString('gp-logo.png', $response['body']);
    }

    public function testLogoAssetIsServed(): void
    {
        $response = $this->get('/gp-logo.png');
        $this->assertSame(200, $response['status']);
    }

    // ---------------------------------------------------------------------------

    private function get(string $path): array
    {
        $ch = curl_init(sprintf('http://127.0.0.1:%d%s', self::$port, $path));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => false,
            CURLOPT_TIMEOUT        => 5,
        ]);
        $body   = (string) curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['status' => $status, 'body' => $body];
    }

    private static function freePort(): int
    {
        $sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        socket_bind($sock, '0.0.0.0', 0);
        socket_getsockname($sock, $addr, $port);
        socket_close($sock);
        return $port;
    }
}

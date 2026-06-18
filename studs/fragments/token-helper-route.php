// -- token-helper: access token endpoint for Hosted Fields ------------------
require_once __DIR__ . '/components/token-helper.php';

if ($method === 'GET' && $uri === '/api/access-token') {
    try {
        $result = generateAccessToken();
        echo json_encode($result);
    } catch (Throwable $e) {
        sendError($e);
    }
    exit;
}

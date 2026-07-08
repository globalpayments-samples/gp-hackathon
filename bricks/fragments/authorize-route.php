// -- authorize: hold funds without capturing ---------------------------------
require_once __DIR__ . '/components/authorize.php';

if ($method === 'POST' && $uri === '/api/authorize') {
    try {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = authorize([
            'token'    => $body['token']    ?? '',
            'amount'   => $body['amount']   ?? '29.99',
            'currency' => $body['currency'] ?? 'USD',
        ]);
        echo json_encode($result);
    } catch (Throwable $e) {
        sendError($e);
    }
    exit;
}

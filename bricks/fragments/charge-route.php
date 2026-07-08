// -- charge: single-step authorization and capture ---------------------------
require_once __DIR__ . '/components/charge.php';

if ($method === 'POST' && $uri === '/api/charge') {
    try {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = charge([
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

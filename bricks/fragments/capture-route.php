// -- capture: settle a previously authorized transaction ---------------------
require_once __DIR__ . '/components/capture.php';

if ($method === 'POST' && preg_match('#^/api/capture/([^/]+)$#', $uri, $m)) {
    try {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = capture([
            'transactionId' => urldecode($m[1]),
            'amount'        => $body['amount']   ?? null,
            'currency'      => $body['currency'] ?? 'USD',
        ]);
        echo json_encode($result);
    } catch (Throwable $e) {
        sendError($e);
    }
    exit;
}

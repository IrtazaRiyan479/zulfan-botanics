<?php
require_once __DIR__ . '/payment-common.php';

function meezan_config(): array {
    return [
        'base' => rtrim(app_env('MEEZAN_BASE_URL'), '/'),
        'session' => '/api/checkout/v1/session',
        'portal' => '/checkout/',
    ];
}

function meezan_sign(string $json): string {
    $path = app_env('MEEZAN_PRIVATE_KEY_PATH');
    $pem = $path !== '' && is_file($path) ? file_get_contents($path) : false;
    $key = $pem ? openssl_pkey_get_private($pem, app_env('MEEZAN_PASSWORD')) : false;
    if (!$key) throw new RuntimeException('Meezan private key is unavailable');
    $sig = '';
    if (!openssl_sign($json, $sig, $key, OPENSSL_ALGO_SHA256)) throw new RuntimeException('Meezan request signing failed');
    return base64_encode($sig);
}

function meezan_verify(array $data): bool {
    $sig = (string)($data['signature'] ?? $data['SIGNATURE'] ?? '');
    $path = app_env('MEEZAN_PUBLIC_KEY_PATH');
    $pem = $path !== '' && is_file($path) ? file_get_contents($path) : false;
    if (!$pem || $sig === '') return false;
    unset($data['signature'], $data['SIGNATURE']);
    ksort($data, SORT_STRING);
    return openssl_verify(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), base64_decode($sig), $pem, OPENSSL_ALGO_SHA256) === 1;
}

function meezan_callback(): void {
    if (!meezan_verify($_POST)) api_json(400, ['ok' => false, 'error' => 'Meezan response signature verification failed']);
    $no = (string)($_POST['reference'] ?? $_POST['REFERENCE'] ?? $_POST['order_no'] ?? '');
    $status = strtoupper((string)($_POST['status'] ?? $_POST['STATUS'] ?? ''));
    $paid = $no !== '' && in_array($status, ['SUCCESS', 'PAID', '0000'], true);
    if ($paid) mark_order_paid($no, (string)($_POST['transactionId'] ?? $_POST['TRANSACTION_ID'] ?? $no));
    header('Location: ' . rtrim(app_env('APP_URL'), '/') . '/checkout.html?payment=' . ($paid ? 'paid' : 'pending') . '&order_no=' . rawurlencode($no));
    exit;
}

if (($_GET['action'] ?? '') === 'return') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') api_json(405, ['ok' => false, 'error' => 'Invalid callback method']);
    meezan_callback();
}

api_method('POST');
if (app_env('MEEZAN_ENABLED', 'false') !== 'true') api_json(403, ['ok' => false, 'error' => 'Meezan card checkout is disabled']);
$cfg = meezan_config();
if ($cfg['base'] === '') api_json(503, ['ok' => false, 'error' => 'Set MEEZAN_BASE_URL']);
try {
    $order = payment_order((string)(api_input()['order_no'] ?? ''));
    if ($order['payment_method'] !== 'meezan') api_json(422, ['ok' => false, 'error' => 'Order payment method mismatch']);
    $payload = ['ORDER' => [
        'SUBTOTAL' => (int)$order['total'],
        'DISCOUNT_ON_TOTAL' => 0,
        'reference' => $order['order_no'],
        'returnUrl' => app_env('MEEZAN_RETURN_URL', rtrim(app_env('APP_URL'), '/') . '/api/meezan.php?action=return'),
        'cancelUrl' => app_env('MEEZAN_CANCEL_URL', rtrim(app_env('APP_URL'), '/') . '/checkout.html?payment=cancelled'),
    ]];
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $request = [
        'payload' => $payload,
        'signature' => meezan_sign($json),
        'userId' => app_env('MEEZAN_USER_ID'),
        'password' => app_env('MEEZAN_PASSWORD'),
        'channel' => app_env('MEEZAN_CHANNEL'),
    ];
    $r = gateway_post($cfg['base'] . $cfg['session'], ['Content-Type: application/json', 'Accept: application/json'], json_encode($request));
    $session = (string)($r['data']['SESSION_ID'] ?? $r['data']['sessionId'] ?? '');
    if ($session === '') api_json(502, ['ok' => false, 'error' => 'Meezan did not return a checkout session']);
    api_json(200, ['ok' => true, 'url' => $cfg['base'] . $cfg['portal'] . '?SESSION_ID=' . rawurlencode($session)]);
} catch (Throwable $e) {
    api_json(502, ['ok' => false, 'error' => $e->getMessage()]);
}

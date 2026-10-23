<?php
require_once __DIR__ . '/payment-common.php';

function ep_base(): string {
    return strtolower(app_env('EASYPAISA_ENV', 'sandbox')) === 'live'
        ? 'https://easypay.easypaisa.com.pk'
        : 'https://easypaystg.easypaisa.com.pk';
}

function ep_hash(string $value, string $key): string {
    $key = substr(str_pad($key, 16, "\0"), 0, 16);
    $pad = 16 - (strlen($value) % 16);
    $value .= str_repeat(chr($pad), $pad);
    $cipher = openssl_encrypt($value, 'AES-128-ECB', $key, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING);
    return base64_encode($cipher === false ? '' : $cipher);
}

function ep_hosted(array $o): array {
    $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Karachi'));
    $store = app_env('EASYPAISA_STORE_ID');
    $f = [
        'amount' => number_format((float)$o['total'], 1, '.', ''),
        'storeId' => $store,
        'postBackURL' => rtrim(app_env('APP_URL'), '/') . '/api/easypaisa.php?action=return',
        'orderRefNum' => order_prefix($o['order_no'], 'EP'),
        'expiryDate' => $now->modify('+1 hour')->format('Ymd His'),
        'autoRedirect' => '1',
        'paymentMethod' => 'MA_PAYMENT_METHOD',
        'emailAddr' => $o['email'],
        'mobileNum' => $o['phone'],
    ];
    $raw = 'amount=' . $f['amount']
        . '&autoRedirect=1&emailAddr=' . $f['emailAddr']
        . '&mobileNum=' . $f['mobileNum']
        . '&orderRefNum=' . $f['orderRefNum']
        . '&paymentMethod=MA_PAYMENT_METHOD'
        . '&postBackURL=' . $f['postBackURL']
        . '&storeId=' . $f['storeId'];
    $f['merchantHashedReq'] = ep_hash($raw, app_env('EASYPAISA_HASH_KEY'));
    return $f;
}

function ep_return_plain(array $d): string {
    $allow = ['amount', 'desc', 'description', 'orderRefNum', 'orderRefNumber', 'paymentMethod', 'responseCode', 'responseDesc', 'status', 'storeId', 'transactionId'];
    $map = [];
    foreach ($allow as $name) {
        if (!isset($d[$name]) || is_array($d[$name])) continue;
        $value = trim((string)$d[$name]);
        if ($value === '') continue;
        $map[$name] = $value;
    }
    ksort($map, SORT_STRING);
    $parts = [];
    foreach ($map as $name => $value) $parts[] = $name . '=' . $value;
    return implode('&', $parts);
}

function ep_given_hash(array $d): string {
    $given = trim((string)($d['merchantHashedResp'] ?? ''));
    if ($given === '') $given = trim((string)($d['hash'] ?? ''));
    if ($given === '' && (isset($d['status']) || isset($d['responseCode']))) $given = trim((string)($d['merchantHashedReq'] ?? ''));
    return str_replace(' ', '+', $given);
}

function ep_return_hash_ok(array $d, string $given): bool {
    $key = app_env('EASYPAISA_HASH_KEY');
    if ($given === '' || $key === '') return false;
    $ref = (string)($d['orderRefNumber'] ?? $d['orderRefNum'] ?? '');
    $code = (string)($d['responseCode'] ?? $d['status'] ?? '');
    $desc = (string)($d['responseDesc'] ?? $d['desc'] ?? $d['description'] ?? '');
    $store = (string)($d['storeId'] ?? app_env('EASYPAISA_STORE_ID'));
    $documented = 'orderRefNumber=' . $ref . '&responseCode=' . $code . '&responseDesc=' . $desc . '&storeId=' . $store;
    $candidates = [
        ep_hash(ep_return_plain($d), $key),
        ep_hash($documented, $key),
        base64_encode(hash_hmac('sha256', $documented, $key, true)),
        strtoupper(hash_hmac('sha256', $documented, $key)),
    ];
    foreach ($candidates as $candidate) {
        if ($candidate !== '' && hash_equals($candidate, $given)) return true;
    }
    return false;
}

function ep_order_no(array $d): string {
    return trim((string)($d['orderRefNumber'] ?? $d['orderRefNum'] ?? $d['orderId'] ?? $d['order_id'] ?? ''));
}

function ep_headers(): array {
    return [
        'Content-Type: application/json',
        'Accept: application/json',
        'Credentials: ' . base64_encode(app_env('EASYPAISA_USERNAME') . ':' . app_env('EASYPAISA_PASSWORD')),
    ];
}

function ep_store_id() {
    $store = app_env('EASYPAISA_STORE_ID');
    return ctype_digit($store) ? (int)$store : $store;
}

function ep_classify(array $d): string {
    $code = (string)($d['responseCode'] ?? '');
    $status = strtoupper(trim((string)($d['transactionStatus'] ?? '')));
    $desc = strtolower((string)($d['responseDesc'] ?? ''));
    if ($status === 'PAID' || $status === 'SUCCESS') return 'paid';
    if (in_array($status, ['FAILED', 'FAILURE', 'BLOCKED', 'EXPIRED', 'CANCELLED', 'CANCELED', 'REVERSED', 'DECLINED'], true)) return 'failed';
    if ($status === 'PENDING') return 'pending';
    if ($code === '0000' && $status === '') return 'paid';
    if (preg_match('/pending|waiting|in progress|processing|prompt|not found/', $desc)) return 'pending';
    if (preg_match('/fail|invalid|insufficient|declin|block|expire|reject|cancel/', $desc)) return 'failed';
    if ($code === '') return 'pending';
    return 'failed';
}

function ep_inquire(string $orderNo): array {
    $body = json_encode(['orderId' => $orderNo, 'storeId' => ep_store_id()]);
    return gateway_post(ep_base() . '/easypay-service/rest/v4/inquire-transaction', ep_headers(), $body)['data'];
}

function ep_confirm_paid(string $orderNo, array $data): bool {
    if ($orderNo === '' || ep_classify($data) !== 'paid') return false;
    mark_order_paid($orderNo, (string)($data['transactionId'] ?? $orderNo));
    return true;
}

function ep_redirect(bool $paid, string $orderNo): never {
    header('Location: ' . rtrim(app_env('APP_URL'), '/') . '/checkout.html?payment=' . ($paid ? 'paid' : 'pending') . '&order_no=' . rawurlencode($orderNo));
    exit;
}

function ep_confirm_form(string $token): never {
    $action = ep_base() . '/easypay/Confirm.jsf';
    $final = rtrim(app_env('APP_URL'), '/') . '/api/easypaisa.php?action=final';
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html><body><form id="epConfirm" method="post" action="' . htmlspecialchars($action, ENT_QUOTES) . '">';
    echo '<input type="hidden" name="auth_token" value="' . htmlspecialchars($token, ENT_QUOTES) . '">';
    echo '<input type="hidden" name="postBackURL" value="' . htmlspecialchars($final, ENT_QUOTES) . '">';
    echo '</form><script>document.getElementById("epConfirm").submit()</script></body></html>';
    exit;
}

function ep_finish(array $d): never {
    $orderNo = ep_order_no($d);
    $given = ep_given_hash($d);
    if ($given !== '' && !ep_return_hash_ok($d, $given)) ep_redirect(false, $orderNo);
    $paid = false;
    if ($orderNo !== '') {
        try {
            $paid = ep_confirm_paid($orderNo, ep_inquire($orderNo));
        } catch (Throwable $e) {
            $paid = false;
        }
    }
    ep_redirect($paid, $orderNo);
}

function ep_credentials_ready(): bool {
    return app_env('EASYPAISA_STORE_ID') !== '' && app_env('EASYPAISA_USERNAME') !== '' && app_env('EASYPAISA_PASSWORD') !== '' && app_env('EASYPAISA_HASH_KEY') !== '';
}

function ep_status(string $orderNo): array {
    try {
        $data = ep_inquire($orderNo);
    } catch (Throwable $e) {
        return ['ok' => true, 'paid' => false, 'pending' => true, 'order_no' => $orderNo, 'message' => 'Still waiting for EasyPaisa approval'];
    }
    $state = ep_classify($data);
    $paid = $state === 'paid' && ep_confirm_paid($orderNo, $data);
    return [
        'ok' => true,
        'paid' => $paid,
        'pending' => !$paid && $state !== 'failed',
        'order_no' => $orderNo,
        'message' => $paid ? 'Payment received' : (string)($data['responseDesc'] ?? ($state === 'failed' ? 'EasyPaisa payment failed' : 'Approve the payment in the EasyPaisa app')),
    ];
}

function ep_ma_wait(string $orderNo): array {
    $deadline = time() + 45;
    $message = 'Approve the payment in the EasyPaisa app';
    while (true) {
        $status = ep_status($orderNo);
        if ($status['paid'] || !$status['pending']) return $status;
        $message = (string)$status['message'];
        if (time() >= $deadline) break;
        sleep(5);
    }
    return ['ok' => true, 'paid' => false, 'pending' => true, 'order_no' => $orderNo, 'message' => $message];
}

$action = (string)($_GET['action'] ?? '');
if ($action === 'return') {
    $d = array_merge($_GET, $_POST);
    unset($d['action']);
    $token = trim((string)($d['auth_token'] ?? ''));
    $status = trim((string)($d['status'] ?? $d['responseCode'] ?? ''));
    if ($token !== '' && $status === '' && ep_given_hash($d) === '') ep_confirm_form($token);
    ep_finish($d);
}
if ($action === 'final') {
    $d = array_merge($_GET, $_POST);
    unset($d['action']);
    ep_finish($d);
}

api_method('POST');
$in = api_input();
try {
    $no = (string)($in['order_no'] ?? '');
    $o = payment_order($no);
    if ($o['payment_method'] !== 'easypaisa') api_json(422, ['ok' => false, 'error' => 'Payment method mismatch']);
    if (!ep_credentials_ready()) api_json(503, ['ok' => false, 'error' => 'EasyPaisa credentials are not configured']);
    $act = (string)($in['action'] ?? '');
    if ($act === 'hosted') api_json(200, ['ok' => true, 'url' => ep_base() . '/easypay/Index.jsf', 'fields' => ep_hosted($o)]);
    if ($act === 'status') {
        set_time_limit(40);
        api_json(200, ep_status(order_prefix($no, 'EP')));
    }
    if ($act !== 'ma') api_json(422, ['ok' => false, 'error' => 'Unknown EasyPaisa action']);
    $mobile = preg_replace('/\D/', '', (string)($in['mobile'] ?? ''));
    if (!preg_match('/^03\d{9}$/', $mobile)) api_json(422, ['ok' => false, 'error' => 'Enter a valid EasyPaisa mobile number']);
    $gatewayOrder = order_prefix($no, 'EP');
    $body = [
        'orderId' => $gatewayOrder,
        'storeId' => ep_store_id(),
        'transactionAmount' => number_format((float)$o['total'], 1, '.', ''),
        'transactionType' => 'MA',
        'mobileAccountNo' => $mobile,
        'emailAddress' => $o['email'] ?: 'customer@example.com',
    ];
    $init = gateway_post(ep_base() . '/easypay-service/rest/v4/initiate-ma-transaction', ep_headers(), json_encode($body));
    if ((string)($init['data']['responseCode'] ?? '') !== '0000') {
        api_json(200, ['ok' => true, 'paid' => false, 'pending' => false, 'message' => (string)($init['data']['responseDesc'] ?? 'EasyPaisa request was not accepted')]);
    }
    set_time_limit(90);
    api_json(200, ep_ma_wait($gatewayOrder));
} catch (Throwable $e) {
    api_json(502, ['ok' => false, 'error' => $e->getMessage()]);
}

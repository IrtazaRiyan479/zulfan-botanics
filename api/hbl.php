<?php
require_once __DIR__ . '/env.php';
if (($_GET['action'] ?? '') === 'return') {
    header('Location: ' . rtrim(app_env('APP_URL'), '/') . '/checkout.html?payment=cancelled');
    exit;
}
api_json(403, ['ok' => false, 'error' => 'HBL checkout is disabled']);

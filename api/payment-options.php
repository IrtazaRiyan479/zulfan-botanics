<?php
require_once __DIR__ . '/env.php';
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['hbl_enabled'=>false,'meezan_enabled'=>app_env('MEEZAN_ENABLED','false')==='true']);

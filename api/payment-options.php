<?php
require_once __DIR__ . '/env.php';
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['hbl_enabled'=>app_env('HBL_ENABLED','false')==='true']);

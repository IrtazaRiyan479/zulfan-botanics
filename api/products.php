<?php
require_once __DIR__ . '/db.php';
try {
    $rows = db()->query('SELECT slug,name,price_pkr,image,page,category,sort_order FROM products ORDER BY sort_order, rowid')->fetchAll();
    api_json(200, ['ok' => true, 'products' => $rows]);
} catch (Throwable $e) {
    api_json(500, ['ok' => false, 'error' => 'Unable to load products']);
}

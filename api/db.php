<?php
require_once __DIR__ . '/env.php';

function db_add_column(PDO $pdo, string $table, string $column, string $definition): void {
    foreach ($pdo->query('PRAGMA table_info(' . $table . ')') as $info) {
        if ($info['name'] === $column) return;
    }
    $pdo->exec('ALTER TABLE ' . $table . ' ADD COLUMN ' . $column . ' ' . $definition);
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) throw new RuntimeException('Unable to create data directory');
    $pdo = new PDO('sqlite:' . $dir . DIRECTORY_SEPARATOR . 'zulfan.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec('PRAGMA foreign_keys=ON');
    $pdo->exec("CREATE TABLE IF NOT EXISTS products(slug TEXT PRIMARY KEY,name TEXT NOT NULL,price_pkr INTEGER NOT NULL,image TEXT NOT NULL,page TEXT NOT NULL,category TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS coupons(code TEXT PRIMARY KEY,percent INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY,order_no TEXT UNIQUE NOT NULL,status TEXT NOT NULL,payment_method TEXT NOT NULL,subtotal INTEGER NOT NULL,discount INTEGER NOT NULL,shipping INTEGER NOT NULL,total INTEGER NOT NULL,customer_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL,address TEXT NOT NULL,city TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',gateway_ref TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY,order_no TEXT NOT NULL,slug TEXT NOT NULL,name TEXT NOT NULL,price INTEGER NOT NULL,qty INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS subscribers(email TEXT PRIMARY KEY,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS order_items_order_no_idx ON order_items(order_no);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC,id DESC);");
    db_add_column($pdo, 'products', 'category', "TEXT NOT NULL DEFAULT ''");
    db_add_column($pdo, 'products', 'sort_order', 'INTEGER NOT NULL DEFAULT 0');
    $seed = [
        ['rosemary', 'Rosemary Hibiscus Elixir', 10500, 'p-2-1.png', 'Scalp Care', 1],
        ['badam', 'Badam Noor Oil', 7500, 'p-2-2.png', 'Shine', 2],
        ['safed-til', 'Safed Til Elixir', 6500, 'p-2-3.png', 'Traditional Care', 3],
        ['black-seed', 'Black Seed Crown Oil', 8900, 'p-2-4.png', 'Root Care', 4],
        ['amla', 'Amla Amrit Oil', 8200, 'p-2-5.png', 'Hair Vitality', 5],
        ['magic-blend', 'Magic Blend Serum Oil', 11200, 'p-2-6.png', 'Frizz Control', 6],
        ['flaxen', 'Flaxen Glow Oil', 6800, 'p-2-7.png', 'Smoothness', 7],
        ['coconut', 'Coconut Elixir', 5500, 'p-2-8.png', 'Deep Nourishment', 8],
        ['kulwanji', 'Kulwanji Root Oil', 9600, 'p-2-9.png', 'Root Strength', 9],
        ['heritage', 'Heritage Herbal Oil', 12000, 'p-2-10.png', 'Signature Blend', 10],
    ];
    $insert = $pdo->prepare('INSERT OR IGNORE INTO products(slug,name,price_pkr,image,page,category,sort_order) VALUES(?,?,?,?,?,?,?)');
    $fill = $pdo->prepare('UPDATE products SET category=?, sort_order=?, image=? WHERE slug=? AND category=""');
    foreach ($seed as [$slug, $name, $price, $image, $category, $sort]) {
        $path = 'assets/img/product/' . $image;
        $insert->execute([$slug, $name, $price, $path, 'product-pages/' . $slug . '.html', $category, $sort]);
        $fill->execute([$category, $sort, $path, $slug]);
    }
    $coupon = $pdo->prepare('INSERT OR IGNORE INTO coupons(code,percent,active) VALUES(?, ?, 1)');
    $coupon->execute(['ZULFAN10', 10]);
    return $pdo;
}

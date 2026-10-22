<?php
require_once __DIR__ . '/env.php';
function db(): PDO {
 static $pdo=null;if($pdo instanceof PDO)return $pdo;$dir=dirname(__DIR__).DIRECTORY_SEPARATOR.'data';if(!is_dir($dir)&&!mkdir($dir,0750,true)&&!is_dir($dir))throw new RuntimeException('Unable to create data directory');$pdo=new PDO('sqlite:'.$dir.DIRECTORY_SEPARATOR.'zulfan.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);$pdo->exec('PRAGMA foreign_keys=ON');
 $pdo->exec("CREATE TABLE IF NOT EXISTS products(slug TEXT PRIMARY KEY,name TEXT NOT NULL,price_pkr INTEGER NOT NULL,image TEXT NOT NULL,page TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS coupons(code TEXT PRIMARY KEY,percent INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY,order_no TEXT UNIQUE NOT NULL,status TEXT NOT NULL,payment_method TEXT NOT NULL,subtotal INTEGER NOT NULL,discount INTEGER NOT NULL,shipping INTEGER NOT NULL,total INTEGER NOT NULL,customer_name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL,address TEXT NOT NULL,city TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',gateway_ref TEXT,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY,order_no TEXT NOT NULL,slug TEXT NOT NULL,name TEXT NOT NULL,price INTEGER NOT NULL,qty INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS subscribers(email TEXT PRIMARY KEY,created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS order_items_order_no_idx ON order_items(order_no);
 CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC,id DESC);");
 $count=(int)$pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();if($count===0){$seed=[['rosemary','Rosemary Hibiscus Elixir',10500,'p-d-1-1.png'],['badam','Badam Noor Oil',7500,'p-d-1-2.png'],['black-seed','Black Seed Crown Oil',8900,'p-d-1-4.png'],['magic-blend','Magic Blend Serum Oil',11200,'p-d-1-6.png'],['amla','Amla Amrit Oil',8200,'p-d-1-5.png'],['flaxen','Flaxen Glow Oil',6800,'p-d-1-7.png'],['heritage','Heritage Herbal Oil',12000,'p-d-1-10.png'],['safed-til','Safed Til Elixir',6500,'p-d-1-3.png'],['kulwanji','Kulwanji Root Oil',9600,'p-d-1-9.png'],['coconut','Coconut Elixir',5500,'p-d-1-8.png']];$q=$pdo->prepare('INSERT INTO products(slug,name,price_pkr,image,page) VALUES(?,?,?,?,?)');foreach($seed as [$slug,$name,$price,$image])$q->execute([$slug,$name,$price,'assets/img/product/'.$image,'product-pages/'.$slug.'.html']);}
 $q=$pdo->prepare('INSERT OR IGNORE INTO coupons(code,percent,active) VALUES(?, ?, 1)');$q->execute(['ZULFAN10',10]);return $pdo;
}

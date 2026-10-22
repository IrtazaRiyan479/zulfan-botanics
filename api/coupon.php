<?php
require_once __DIR__ . '/db.php';
api_method('POST'); $in=api_input();$code=strtoupper(trim((string)($in['code']??'')));$subtotal=max(0,(int)($in['subtotal']??0));
try{$q=db()->prepare('SELECT percent FROM coupons WHERE code=? AND active=1');$q->execute([$code]);$percent=$q->fetchColumn();if($percent===false)api_json(200,['ok'=>false,'error'=>'Invalid coupon','discount'=>0]);api_json(200,['ok'=>true,'discount'=>(int)round($subtotal*(int)$percent/100)]);}catch(Throwable $e){api_json(500,['ok'=>false,'error'=>'Coupon service unavailable']);}

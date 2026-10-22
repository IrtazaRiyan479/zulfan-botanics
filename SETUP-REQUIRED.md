# Customer accounts

- Supabase customer accounts use `assets/js/supabase.js` and the publishable anon key. Run `supabase/customer-accounts.sql` in **Supabase Dashboard → SQL Editor → New query → Run** to create profile, address, and account order tables with RLS.

# PHP + SQLite deployment

1. Copy `.env.example` to `.env` and set `APP_URL`, `ADMIN_PASSWORD`, and mail configuration.
2. Deploy to PHP with PDO SQLite, OpenSSL, and cURL enabled. Keep `data/zulfan.sqlite` inaccessible to public downloads.
3. Open `/api/products.php` once to initialize and seed the product/coupon catalog. Manage orders at `/admin/orders.php`.

# Gateway go-live steps

1. In the merchant portal for each enabled provider, configure these public HTTPS callbacks using the deployed origin in `APP_URL`:
   - `APP_URL/api/jazzcash.php?action=return`
   - `APP_URL/api/easypaisa.php?action=return`
   - `APP_URL/api/hbl.php?action=return`
2. Put merchant credentials only in the server `.env`. Keep `JAZZCASH_ENV=sandbox` and `EASYPAISA_ENV=sandbox` during setup; switch to `live` after approval.
3. EasyPaisa sandbox often accepts only the mobile number issued by the bank and a test amount of `10`.
4. Leave `HBL_ENABLED=false` until the HBL credentials, public/private key files, and `HBL_BASE_URL` from the merchant kit are configured. Meezan is the HBL hosted card flow.
5. Confirm callbacks reach the public URLs and verify successful and declined test transactions before enabling live payments. Only verified gateway responses change an order to `paid`.
6. HBL Pay's sandbox endpoint hostname and merchant payload details are provided by the bank kit; set `HBL_BASE_URL` to that host when received.

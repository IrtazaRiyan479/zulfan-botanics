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
   - `APP_URL/api/meezan.php?action=return`
2. Put merchant credentials only in the server `.env`. Keep `JAZZCASH_ENV=sandbox` and `EASYPAISA_ENV=sandbox` during setup; switch to `live` after approval.
3. EasyPaisa sandbox often accepts only the mobile number issued by the bank and a test amount of `10`.
4. Card checkout is Meezan (`api/meezan.php`). Leave it off until `MEEZAN_ENABLED=true`, `MEEZAN_BASE_URL`, and the Meezan key files are set. `api/hbl.php` is a disabled stub and never marks an order paid.
5. Confirm callbacks reach the public URLs and verify successful and declined test transactions before enabling live payments. Only verified gateway responses change an order to `paid`.
6. Meezan's sandbox hostname and merchant payload details come from the bank kit; set `MEEZAN_BASE_URL` to that host when received. Do not point card checkout at HBL.

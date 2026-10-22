# Go live with gateway payments

- Keep the gateway environment set to `sandbox` until the merchant account is approved and credentials are installed in the server `.env`. Never put merchant passwords, integrity/hash keys, or private keys in browser files.
- Register these public callback URLs with the providers, replacing `APP_URL` with the deployed HTTPS origin:
  - `APP_URL/api/jazzcash.php?action=return`
  - `APP_URL/api/easypaisa.php?action=return`
  - `APP_URL/api/hbl.php?action=return`
- EasyPaisa sandbox often allows only the mobile number issued by the bank and a test amount of 10.
- Do not set `HBL_ENABLED=true` until HBL credentials, key files, and `HBL_BASE_URL` are supplied. Meezan uses the HBL hosted card flow.
- Switch `JAZZCASH_ENV` and `EASYPAISA_ENV` to `live` only after provider confirmation. Configure public callback URLs and verify a complete test order before accepting live payments.

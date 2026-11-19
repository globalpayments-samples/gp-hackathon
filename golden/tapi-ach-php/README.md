# Tapi ach php

TAPI Integrated Payments PHP schema-v2 sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| tapi.ach.refund | brick | Refund an ACH check sale using its prior transaction id |
| tapi.ach.sale | brick | Debit a US bank account with an integrated ACH check sale |

The TAPI scaffold uses `TransactionApiConfig` and credential-gated live routes. Credentials are read only from the environment.

## Configuration

- `TAPI_ACCOUNT_CREDENTIAL`
- `TAPI_API_KEY`
- `TAPI_API_SECRET`
- `TAPI_REGION`

`TAPI_API_VERSION` defaults to `2021-04-08`, and `TAPI_PARTNER_NAME`
defaults to `tapi-ach-php`. Override either value when the assigned
credential package specifies a different API version or registered app name.

# Tapi integrated credit php

TAPI Integrated Payments PHP schema-v2 sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| tapi.credit.authorize | brick | Authorize an integrated credit payment |
| tapi.credit.capture | brick | Capture an integrated credit authorization |
| tapi.credit.refund | brick | Refund an integrated credit transaction using its prior reference |
| tapi.credit.sale | brick | Submit an integrated credit sale |
| tapi.credit.status | brick | Retrieve an integrated credit transaction by reference |
| tapi.credit.void | brick | Void an unsettled integrated credit transaction |
| tapi.idempotency-key | stud | Attach a deterministic caller-supplied correlation key to an integrated request |

The TAPI scaffold uses `TransactionApiConfig` and credential-gated live routes. Credentials are read only from the environment.

## Configuration

- `TAPI_ACCOUNT_CREDENTIAL`
- `TAPI_API_KEY`
- `TAPI_API_SECRET`
- `TAPI_REGION`

`TAPI_API_VERSION` defaults to `2021-04-08`, and `TAPI_PARTNER_NAME`
defaults to `tapi-integrated-credit-php`. Override either value when the assigned
credential package specifies a different API version or registered app name.

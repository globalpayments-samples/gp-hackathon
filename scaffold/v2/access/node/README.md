# {{ PROJECT_TITLE }}

{{ PLATFORM_NAME }} schema-v2 sample generated from catalog manifests. The Checkout tile is public; payment management remains server-side and credential gated.

## Selected components

{{ COMPONENT_TABLE }}

## Access flow

1. The browser requests `POST /api/checkout-sessions` to create a Checkout session.
2. The public tile initializes Access Checkout with the session response and obtains a session URL/token from the browser SDK boundary.
3. The browser posts the session URL/token to `POST /api/payments`.
4. Settlement and cancellation take a `paymentId`; the server builds the Access URL from it and sends no client-supplied body.

There is no generic operation proxy.

## Configuration

{{ CONFIG_VARS }}

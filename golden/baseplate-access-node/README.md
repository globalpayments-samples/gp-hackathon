# Baseplate access node

Access Checkout schema-v2 sample generated from catalog manifests. The Checkout tile is public; payment management remains server-side and credential gated.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| Baseplate only | baseplate | Platform scaffold without optional components. |

## Access flow

1. The browser requests `POST /api/checkout-sessions` to create a Checkout session.
2. The public tile initializes Access Checkout with the session response and obtains a session URL/token from the browser SDK boundary.
3. The browser posts the session URL/token to `POST /api/payments`.
4. Settlement and cancellation follow HAL links from Access responses, constrained to the configured Access origin and path.

There is no generic operation proxy.

## Configuration

- `ACCESS_BASE_URL`
- `ACCESS_MERCHANT_CODE`
- `ACCESS_MERCHANT_KEY`
- `ACCESS_WEBHOOK_SECRET`

# Access checkout node

Access Checkout schema-v2 sample generated from catalog manifests. The Checkout tile is public; payment management remains server-side and credential gated.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| access.checkout.create-session | stud | Create an Access Checkout session and return its HAL links |
| access.payment.authorize-checkout | brick | Submit a guest payment through an active Checkout session |
| access.payment.cancel | brick | Cancel an Access payment by payment id |
| access.payment.query | brick | Query a payment by the merchant reference |
| access.payment.settle | brick | Settle an Access payment by payment id |
| access.tile.checkout | tile | Browser Checkout session and secure guest payment collection |
| common.webhook-receiver | stud | Receive and log asynchronous platform event payloads |

## Access flow

1. The browser requests `POST /api/checkout-sessions` to create a Checkout session.
2. The public tile initializes Access Checkout with the session response and obtains a session URL/token from the browser SDK boundary.
3. The browser posts the session URL/token to `POST /api/payments`.
4. Settlement and cancellation take a `paymentId`; the server builds the Access URL from it and sends no client-supplied body.

There is no generic operation proxy.

## Configuration

- `ACCESS_BASE_URL`
- `ACCESS_MERCHANT_CODE`
- `ACCESS_MERCHANT_KEY`
- `ACCESS_WEBHOOK_SECRET`

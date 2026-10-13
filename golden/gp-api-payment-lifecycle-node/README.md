# Gp api payment lifecycle node

GP API schema-v2 sample generated from catalog manifests, not string-emitted application code.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| gp-api.payment.authorize | brick | Place a payment authorization for later capture |
| gp-api.payment.capture | brick | Capture a prior authorization |
| gp-api.payment.refund | brick | Refund a captured payment using its transaction reference |
| gp-api.payment.reverse | brick | Reverse an authorization before settlement |
| gp-api.payment.status | brick | Retrieve a payment lifecycle status by transaction reference |
| gp-api.tile.hosted-fields | tile | Secure card-entry fields for GP API |
| gp-api.token.verify | brick | Verify a tokenized payment instrument before authorization |

## Routes

Only fixed, component-declared routes are registered. There is no generic operation proxy.

## Configuration

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`

Live routes are credential gated and return HTTP 503 until all required values are present.

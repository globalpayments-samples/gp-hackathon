# Gp api sca exemptions node

GP API schema-v2 sample generated from catalog manifests, not string-emitted application code.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| gp-api.payment.sca-exemption | brick | Charge a tokenized card with an SCA exemption flagged in the authorization (low value, transaction risk analysis, trusted merchant or secure corporate payment) |

## Routes

Only fixed, component-declared routes are registered. There is no generic operation proxy.

## Configuration

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`
- `GP_COUNTRY`

Live routes are credential gated and return HTTP 503 until all required values are present.

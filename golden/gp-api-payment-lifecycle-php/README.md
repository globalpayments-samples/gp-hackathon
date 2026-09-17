# Gp api payment lifecycle php

GP API PHP schema-v2 sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| gp-api.payment.authorize | brick | Place a payment authorization for later capture |
| gp-api.payment.capture | brick | Capture a prior authorization |
| gp-api.payment.refund | brick | Refund a captured payment using its transaction reference |
| gp-api.payment.reverse | brick | Reverse an authorization before settlement |
| gp-api.payment.status | brick | Retrieve a payment lifecycle status by transaction reference |
| gp-api.token.verify | brick | Verify a tokenized payment instrument before authorization |

Routes are explicit and credential gated; no generic operation proxy is generated.

## Configuration

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`

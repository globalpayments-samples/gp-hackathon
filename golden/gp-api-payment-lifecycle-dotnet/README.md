# Gp api payment lifecycle dotnet

GP API schema-v2 .NET sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| gp-api.payment.authorize | brick | Place a payment authorization for later capture |
| gp-api.payment.capture | brick | Capture a prior authorization |
| gp-api.payment.refund | brick | Refund a captured payment using its transaction reference |
| gp-api.payment.reverse | brick | Reverse an authorization before settlement |
| gp-api.payment.status | brick | Retrieve a payment lifecycle status by transaction reference |
| gp-api.token.verify | brick | Verify a tokenized payment instrument before authorization |

## Configuration

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`

Live routes are credential gated. Export values from `.env.example`; the sample never embeds or loads credentials from source.

## Verify

```bash
dotnet build
dotnet test tests/GeneratedSample.Tests.csproj
```

`status` uses `ReportingService.TransactionDetail`; the payment operations use the official `CreditCardData` and `Transaction.FromId` SDK idioms.

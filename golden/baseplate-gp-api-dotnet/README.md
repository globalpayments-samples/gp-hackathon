# Baseplate gp api dotnet

GP API schema-v2 .NET sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| Baseplate only | baseplate | Platform scaffold without optional components. |

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

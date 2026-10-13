# {{ PROJECT_TITLE }}

{{ PLATFORM_NAME }} schema-v2 .NET sample generated from catalog manifests.

## Selected components

{{ COMPONENT_TABLE }}

## Configuration

{{ CONFIG_VARS }}

Live routes are credential gated. Export values from `.env.example`; the sample never embeds or loads credentials from source.

## Verify

```bash
dotnet build
dotnet test tests/GeneratedSample.Tests.csproj
```

`status` uses `ReportingService.TransactionDetail`; the payment operations use the official `CreditCardData` and `Transaction.FromId` SDK idioms.

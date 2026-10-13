# Baseplate tapi dotnet

TAPI Integrated Payments schema-v2 .NET sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| Baseplate only | baseplate | Platform scaffold without optional components. |

## Configuration

- `TAPI_ACCOUNT_CREDENTIAL`
- `TAPI_API_SECRET`
- `TAPI_REGION`

The baseplate maps `TAPI_ACCOUNT_CREDENTIAL`, `TAPI_API_SECRET`, and
`TAPI_REGION` to the official `TransactionApiConfig` properties
`AccountCredential`, `AppSecret`, and `Region`. No credentials are embedded.

## Lifecycle idioms

- `sale` and `authorize` use `CreditCardData` and attach caller-supplied `clientTransactionId` or `idempotencyKey` through `WithClientTransactionId`.
- `capture`, `void`, and linked `refund` use `Transaction.FromId`; the installed SDK has no `WithClientTransactionId` method on `ManagementBuilder`.
- `status` uses `ReportingService.TransactionDetail`.

```bash
dotnet build
dotnet test tests/GeneratedSample.Tests.csproj
```

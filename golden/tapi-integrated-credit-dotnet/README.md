# Tapi integrated credit dotnet

TAPI Integrated Payments schema-v2 .NET sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| tapi.credit.authorize | brick | Authorize an integrated credit payment |
| tapi.credit.capture | brick | Capture an integrated credit authorization |
| tapi.credit.refund | brick | Refund an integrated credit transaction using its prior reference |
| tapi.credit.sale | brick | Submit an integrated credit sale |
| tapi.credit.status | brick | Retrieve an integrated credit transaction by reference |
| tapi.credit.void | brick | Void an unsettled integrated credit transaction |
| tapi.idempotency-key | stud | Attach a deterministic caller-supplied correlation key to an integrated request |

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

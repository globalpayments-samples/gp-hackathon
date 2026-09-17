# Baseplate gp api java

GP API schema-v2 Java sample generated from catalog manifests.

## Selected components

| Component | Layer | Description |
| --- | --- | --- |
| Baseplate only | baseplate | Platform scaffold without optional components. |

## Configuration

- `GP_API_ENVIRONMENT`
- `GP_APP_ID`
- `GP_APP_KEY`

Live routes are credential gated and use environment variables only.

## Verify

```bash
mvn test
mvn package
```

`status` uses `ReportingService.transactionDetail`; capture, refund, and reverse use `Transaction.fromId`, matching the official SDK idiom.

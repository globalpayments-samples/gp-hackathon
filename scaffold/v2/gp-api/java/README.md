# {{ PROJECT_TITLE }}

{{ PLATFORM_NAME }} schema-v2 Java sample generated from catalog manifests.

## Selected components

{{ COMPONENT_TABLE }}

## Configuration

{{ CONFIG_VARS }}

Live routes are credential gated and use environment variables only.

## Verify

```bash
mvn test
mvn package
```

`status` uses `ReportingService.transactionDetail`; capture, refund, and reverse use `Transaction.fromId`, matching the official SDK idiom.

# Global Payments samples — the Lego system

One spec in, one predictable sample project out. Every time.

This monorepo is the internal **component workshop** for the modular "Lego"
sample system: a Baseplate (shared infrastructure), Studs (primitives), Bricks
(atomic SDK operations), and Tiles (UI components), composed by a Builder CLI
into **standalone, runnable sample projects** via a structured insertion/slot
model. Built and proven end-to-end at the company hackathon.

## The problem

- 30+ legacy sample repos duplicate SDK setup, config handling, and dependency
  updates — every upgrade is 30 manual PRs.
- Developers wade through ~200 lines of boilerplate to find ~15 lines of
  transactional code.

A generated project's entry point is ~55 lines, and every one of them is signal.

## Platform support

Schema-version-2 specs select an explicit platform profile. Version-1 specs remain
supported and default to GP API, preserving existing generated output. The v2
anchors are GP API Node/PHP/.NET/Java, Access Node, and TAPI PHP/.NET. `npm test`
checks that each one builds deterministically and matches its golden output; the
contract tests inside the generated projects are not run from this repo.

| Platform | Integration modes | Supported sample languages |
| -------- | ----------------- | -------------------------- |
| GP API | server SDK, direct REST, web SDK | Node.js, PHP, .NET, Java |
| Access Checkout | REST, web SDK | Node.js |
| TAPI Integrated Payments | server SDK, direct REST | PHP, .NET |

The builder rejects cross-platform component IDs, unsupported languages, modes,
and declared region mismatches before it writes an output directory. V2 samples
include credential-gated live paths: absent credentials produce explicit errors,
never simulated payment success.

## Language support

| Language | Scaffold | Baseplate | Bricks | Studs |
| -------- | -------- | --------- | ------ | ----- |
| Node.js  | ✅       | ✅        | ✅     | ✅    |
| PHP      | ✅       | ✅        | ✅     | ✅    |
| .NET     | ✅       | ✅        | ✅     | ✅    |
| Java     | ✅       | ✅        | ✅     | ✅    |
| Python   | roadmap  | —         | —      | —     |
| Go       | roadmap  | —         | —      | —     |

## Layout

```
core/                  Baseplate: config manager, Express shell, exception handler (Node)
studs/                 token-helper (+ fragments, tests)
bricks/                payments: charge / authorize / capture (+ fragments, tests)
tiles/hosted-fields/   secure card-entry tile (+ fragments, tests)
component_catalog/     *.component.yaml manifests + catalog.json (138 components, 25 repos)
catalog-sweep/         raw sweep data feeding generate-catalog.js
scaffold/node/         Node standalone-project template with named {{ SLOT }} markers
scaffold/php/          PHP standalone-project template
scaffold/dotnet/       .NET standalone-project template (ASP.NET Core Minimal API)
scaffold/java/         Java standalone-project template (Jakarta EE Servlet + Cargo/Tomcat)
builder/               build-project.js (deterministic generation) + snapshot-test.js
specs/                 project specs — simple-checkout / delayed-capture × 4 languages
golden/                expected Builder output that snapshot-test.js diffs against
output/                generated projects land here (gitignored)
```

## Quick start

```bash
npm install

# Node.js
node builder/build-project.js specs/simple-checkout-node.yaml
cd output/simple-checkout-node && cp ../../.env .env && npm install && npm start

# PHP
node builder/build-project.js specs/simple-checkout-php.yaml
cd output/simple-checkout-php && cp ../../.env .env && composer install && ./run.sh

# .NET
node builder/build-project.js specs/simple-checkout-dotnet.yaml
cd output/simple-checkout-dotnet && cp ../../.env .env && dotnet run

# Java
node builder/build-project.js specs/simple-checkout-java.yaml
cd output/simple-checkout-java && cp ../../.env .env && mvn integration-test

# prove determinism: two builds byte-identical + matches golden/
npm test                    # from the monorepo root
```

## Delayed capture

Authorize now, capture later — a two-step payment flow with separate
`/api/authorize` and `/api/capture/:transactionId` endpoints.

```bash
# Node.js
node builder/build-project.js specs/delayed-capture-node.yaml
cd output/delayed-capture-node && cp ../../.env .env && npm install && npm start

# PHP
node builder/build-project.js specs/delayed-capture-php.yaml
cd output/delayed-capture-php && cp ../../.env .env && composer install && ./run.sh

# .NET
node builder/build-project.js specs/delayed-capture-dotnet.yaml
cd output/delayed-capture-dotnet && cp ../../.env .env && dotnet run

# Java
node builder/build-project.js specs/delayed-capture-java.yaml
cd output/delayed-capture-java && cp ../../.env .env && mvn integration-test
```

## Phase 2 anchors

```bash
node builder/build-project.js specs/gp-api-payment-lifecycle-node.yaml
node builder/build-project.js specs/gp-api-payment-lifecycle-php.yaml
node builder/build-project.js specs/gp-api-payment-lifecycle-dotnet.yaml
node builder/build-project.js specs/gp-api-payment-lifecycle-java.yaml
node builder/build-project.js specs/access-checkout-node.yaml
node builder/build-project.js specs/tapi-integrated-credit-php.yaml
node builder/build-project.js specs/tapi-integrated-credit-dotnet.yaml
```

The GP API payment lifecycle is generator-validated in Node.js, PHP, .NET, and Java.
The Access Checkout anchor covers Checkout session creation, guest payment,
server-built settlement/cancel actions (by payment id), events, and query-by-reference in Node.
The TAPI integrated-credit lifecycle is generator-validated in PHP and .NET. The
.NET anchor uses the official `TransactionApiConfig` properties and integration-test
idioms for sale, authorize, capture, void, linked refund, and reporting status.
Both anchors accept the shared `TAPI_ACCOUNT_CREDENTIAL`, `TAPI_API_SECRET`, and
`TAPI_REGION` names. PHP additionally uses `TAPI_API_KEY`; its protocol version
and partner-app name have safe, overridable defaults.

Validate the root `.env` without creating a transaction:

```bash
npm run validate:tapi-credentials
```

The probe requests a randomly generated, nonexistent sandbox transaction ID.
An authenticated client receives a normal API validation/not-found response;
`401` and `403` are treated as credential failures. No credential values are
printed.

TAPI Java remains outside the approved generator catalog. The local official
artifact `com.heartlandpaymentsystems:globalpayments-sdk:14.2.20` does contain
`com.global.api.serviceConfigs.TransactionApiConfig` and
`com.global.api.gateways.TransactionApiConnector`; the unsupported status is a
product/catalog boundary, not an SDK absence. A v2 TAPI Java spec therefore fails
explicitly instead of generating direct REST or an unapproved SDK sample.
Each generated anchor includes `.env.example`, contract tests, Docker assets,
`AGENTS.md`, `llms.txt`, and Developer Portal metadata.

## SCA exemptions

Charge a tokenized card with a PSD2 SCA exemption flagged in the authorization,
with no 3D Secure authentication first. One route,
`/api/payments/charge-with-exemption`, takes `token`, `amount`, `currency` and
`exemption`: `low-value`, `transaction-risk-analysis`, `trusted-merchant` or
`secure-corporate-payment`. The issuer decides whether the exemption applies;
if it doesn't, expect a soft decline asking for authentication.

```bash
node builder/build-project.js specs/gp-api-sca-exemptions-node.yaml
node builder/build-project.js specs/gp-api-sca-exemptions-php.yaml
```

`GP_COUNTRY` is required (a European country, for example `IE`) because SCA
only applies to European merchants. Exemptions requested inside a 3D Secure
authentication need a 3D Secure brick, which the builder does not have yet.
SCA delegation is left out because it is not an authorization-message exemption.

## TAPI ACH

Debit a US bank account with an ACH check sale and refund it later against the
original sale. Two routes, `/api/ach/sale` and `/api/ach/refund`. A sale takes
`accountType` (`checking` or `savings`), `accountNumber`, `routingNumber` and
`amount`, plus `checkNumber` and `entryClass` if you have them. `entryClass`
is `WEB` unless you send `PPD`, `CCD` or `TEL`. A refund takes the
`transactionId` of the sale, `accountType` and `amount`, and the same two
optional fields.

```bash
node builder/build-project.js specs/tapi-ach-php.yaml
```

PHP only for now, and `TAPI_REGION` has to be `US` because the Canadian ACH
fields are different. There is no default amount. The PHP SDK does not send a
client transaction id on a TAPI sale (the reference id is generated for every
request), so nothing ties a retried request to the first one and the sample has
no idempotency key; de-duplicate on your side before retrying. The SDK also
only sends the entry class when transaction data is attached and defaults a
refund's account type to "0.00", so the brick sets both explicitly.

It has not been run against the TAPI sandbox yet. The contract test checks
offline, through the SDK's own request builders, that a sale goes to
`checksales` and a refund to `checksales/{id}/checkrefunds` with the bank
details and entry class in the request. It needs `composer install`.

## How composition works

Each component ships a manifest (`component_catalog/<id>.component.yaml`)
declaring real language-keyed `files`, one-level `depends_on`, required env
vars, deterministic `test_fragments`, and **insertion fragments** mapped to named scaffold slots (`IMPORTS`, `TARGET_BEFORE`,
`TARGET_DURING_1`, `ROUTE_HANDLERS`, `WIRING`, `TARGET_AFTER`,
`FRONTEND_CONFIG`, `TILE_MARKUP`, `TILE_SCRIPTS`).

The Builder resolves the dependency closure (refusing cycles), then substitutes
fragments into slots in a fixed order — dependency order first, then component
id alphabetically. No timestamps, no random ids, sorted iteration everywhere:
the same spec always produces a byte-identical project, which is what makes
regeneration a maintenance model instead of 30 manual PRs.

Generated projects are **fully detached**: the baseplate and component files are
vendored in, so end users get a self-contained sample matching the existing
sample project model.

## The catalog

`component_catalog/catalog.json` inventories every Brick/Stud/Tile/Baseplate
candidate across all 25 legacy repos with layer classification and extraction
difficulty — the prioritized Phase 3 porting backlog. The five demo-path
components are marked `status: extracted` and link to their manifests.

## Brand

All generated UI follows the [Global Payments brand guide](https://www.gpbrandguide.com/):
Global Blue `#262AFF` + white primary, DM Sans (the approved web substitute for
GP Commerce), left-aligned sentence-case type at 150% line height, tertiary
accents only as accents, Raspberry reserved for negative states, no gradients.

## Roadmap (per the architectural spec)

1. **Phase 1-2** — In progress: schema-v2 anchors are generated only for verified
   platform/language SDK combinations. Unsupported combinations fail generation;
   they are not represented as runnable samples.
2. **Phase 3** — port all 30+ scenarios from `catalog.json`; deprecate legacy repos.
3. **Phase 4** — CI regenerates samples from specs on SDK releases; the
   snapshot test is the seed.
4. **North Star** — docs-site "build your starter" page powered by the same
   catalog and Builder; `catalog.json` as an MCP resource for AI tooling.

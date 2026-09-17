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
supported and default to GP API, preserving existing generated output. The
currently verified v2 anchors are GP API Node/PHP, Access Node, and TAPI PHP.

| Platform | Integration modes | Supported sample languages |
| -------- | ----------------- | -------------------------- |
| GP API | server SDK, direct REST, web SDK | Node.js, PHP, .NET, Java |
| Access Checkout | REST, web SDK | Node.js |
| TAPI Integrated Payments | server SDK, direct REST | PHP |

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
golden/simple-checkout-node Hand-validated expected Builder output (determinism reference)
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
cd output/simple-checkout-php && cp ../../.env .env && composer install && php -S 0.0.0.0:3000 router.php

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
cd output/delayed-capture-php && cp ../../.env .env && composer install && php -S 0.0.0.0:3000 router.php

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
node builder/build-project.js specs/gp-api-payment-lifecycle-dotnet.yaml
node builder/build-project.js specs/gp-api-payment-lifecycle-java.yaml
node builder/build-project.js specs/access-checkout-node.yaml
node builder/build-project.js specs/tapi-integrated-credit-php.yaml
node builder/build-project.js specs/tapi-integrated-credit-dotnet.yaml
```

The GP API payment lifecycle is generator-validated in Node.js, PHP, .NET, and Java.
The Access Checkout anchor covers Checkout session creation, guest payment,
HAL-managed settlement/cancel actions, events, and query-by-reference in Node.
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

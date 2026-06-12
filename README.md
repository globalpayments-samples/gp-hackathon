# Global Payments samples — the Lego system (Node vertical slice)

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

A generated project's `index.js` is ~55 lines, and every one of them is signal.

## Layout

```
core/                  Baseplate: config manager, Express shell, exception handler
studs/                 token-helper (+ fragments, tests)
bricks/                payments.js: charge / authorize / capture (+ fragments, tests)
tiles/hosted-fields/   secure card-entry tile (+ fragments, tests)
component_catalog/     *.component.yaml manifests + catalog.json (138 components, 25 repos)
catalog-sweep/         raw sweep data feeding generate-catalog.js
scaffold/node/         standalone-project template with named {{ SLOT }} markers
builder/               build-project.js (deterministic generation) + snapshot-test.js
specs/                 project specs: simple-checkout, delayed-capture
golden/simple-checkout Hand-validated expected Builder output (determinism reference)
output/                generated projects land here (gitignored)
```

## Quick start

```bash
npm install

# generate a standalone project from a spec
node builder/build-project.js specs/delayed-capture.yaml

# run it
cd output/delayed-capture
cp ../../.env .env          # or fill .env.example with your sandbox credentials
npm install && npm start    # branded checkout on http://localhost:3000
npm test                    # real sandbox integration tests (skip cleanly without creds)

# prove determinism: two builds byte-identical + matches golden/
npm test                    # from the monorepo root
```

## How composition works

Each component ships a manifest (`component_catalog/<id>.component.yaml`)
declaring its files, one-level `depends_on`, required env vars, and **insertion
fragments** mapped to named scaffold slots (`IMPORTS`, `TARGET_BEFORE`,
`TARGET_DURING_1`, `ROUTE_HANDLERS`, `WIRING`, `TARGET_AFTER`,
`FRONTEND_CONFIG`, `TILE_MARKUP`, `TILE_SCRIPTS`).

The Builder resolves the dependency closure (refusing cycles), then substitutes
fragments into slots in a fixed order — dependency order first, then component
id alphabetically. No timestamps, no random ids, sorted iteration everywhere:
the same spec always produces a byte-identical project, which is what makes
regeneration a maintenance model instead of 30 manual PRs.

Generated projects are **fully detached**: `core/` and component files are
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

1. **Phase 1-2 remainder** — PHP, Java, .NET, Python baseplates and scaffolds;
   extract remaining components prioritized by catalog difficulty ratings.
2. **Phase 3** — port all 30+ scenarios from `catalog.json`; deprecate legacy repos.
3. **Phase 4** — CI regenerates samples from specs on SDK releases; the
   snapshot test is the seed.
4. **North Star** — docs-site "build your starter" page powered by the same
   catalog and Builder; `catalog.json` as an MCP resource for AI tooling.

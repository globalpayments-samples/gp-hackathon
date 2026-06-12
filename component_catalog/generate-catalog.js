#!/usr/bin/env node
/**
 * Expands catalog-sweep/sweep-data.js into component_catalog/catalog.json —
 * the full cross-repo component inventory (Phase 3 porting backlog).
 *
 * Deterministic: entries sorted by id, stable JSON formatting, no timestamps.
 * Demo-path components already extracted into this monorepo are marked with
 * status "extracted" and their internal manifest path.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { REPOS } = require('../catalog-sweep/sweep-data');

// Components already extracted into this monorepo (the vertical slice).
const EXTRACTED = {
  'online-card-payments-drop-in-access-token': 'token-helper',
  'online-card-payments-sale-charge': 'charge',
  'online-payments-auth-and-delayed-capture-authorize': 'authorize',
  'online-payments-auth-and-delayed-capture-delayed-capture': 'capture',
  'online-card-payments-drop-in-ui': 'hosted-fields',
};

const entries = [];
for (const { repo, langs, entries: repoEntries } of REPOS) {
  for (const [suffix, layer, name, description, capabilities, deps, config, difficulty, files] of repoEntries) {
    const id = `${repo}-${suffix}`;
    const entry = {
      id,
      layer,
      name,
      description,
      capabilities,
      files: files || langs.map((lang) => `${repo}/${lang}/**/*`),
      depends_on: deps.map((d) => `${repo}-${d}`),
      config_required: config,
      source_repo: repo,
      extraction_difficulty: difficulty,
    };
    if (EXTRACTED[id]) {
      entry.status = 'extracted';
      entry.monorepo_component = EXTRACTED[id];
      entry.manifest = `component_catalog/${EXTRACTED[id]}.component.yaml`;
    }
    entries.push(entry);
  }
}

entries.sort((a, b) => a.id.localeCompare(b.id));

const repos = [...new Set(entries.map((e) => e.source_repo))].sort();
const catalog = {
  description:
    'Cross-repo component inventory for the Global Payments sample ecosystem, ' +
    'classified into baseplate/stud/brick/tile layers with extraction difficulty ratings. ' +
    'This is the Phase 3 porting backlog.',
  repos_covered: repos.length,
  component_count: entries.length,
  repos,
  components: entries,
};

const out = path.join(__dirname, 'catalog.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
console.log(`catalog.json: ${entries.length} components across ${repos.length} repos`);

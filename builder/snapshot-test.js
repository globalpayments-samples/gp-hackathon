#!/usr/bin/env node
/**
 * Determinism harness.
 *
 * 1. Builds the simple-checkout spec twice into temp dirs and requires the
 *    two outputs to be byte-identical (same spec → same project, every time).
 * 2. Diffs the build against golden/simple-checkout — the hand-validated
 *    expected output — failing on ANY difference.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { build } = require('./build-project');

const ROOT = path.join(__dirname, '..');
const SPEC = path.join(ROOT, 'specs', 'simple-checkout.yaml');
const GOLDEN = path.join(ROOT, 'golden', 'simple-checkout');

function listFilesRecursive(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...listFilesRecursive(full, base));
    } else {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function diffTrees(labelA, dirA, labelB, dirB) {
  const a = new Set(listFilesRecursive(dirA));
  const b = new Set(listFilesRecursive(dirB));
  const problems = [];
  for (const f of a) if (!b.has(f)) problems.push(`only in ${labelA}: ${f}`);
  for (const f of b) if (!a.has(f)) problems.push(`only in ${labelB}: ${f}`);
  for (const f of a) {
    if (!b.has(f)) continue;
    const bufA = fs.readFileSync(path.join(dirA, f));
    const bufB = fs.readFileSync(path.join(dirB, f));
    if (!bufA.equals(bufB)) problems.push(`content differs: ${f}`);
  }
  return problems;
}

function main() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-snapshot-'));
  const buildA = path.join(tmp, 'a');
  const buildB = path.join(tmp, 'b');

  build(SPEC, buildA);
  build(SPEC, buildB);

  const repeatability = diffTrees('first build', buildA, 'second build', buildB);
  if (repeatability.length > 0) {
    console.error('\nDeterminism BROKEN — same spec produced different output:');
    for (const p of repeatability) console.error('  - ' + p);
    process.exit(1);
  }
  console.log('✔ Determinism: two builds of the same spec are byte-identical');

  if (!fs.existsSync(GOLDEN)) {
    console.error(
      '\nGolden reference missing at golden/simple-checkout.\n' +
        'Validate a build by hand, then promote it:\n' +
        `  node builder/build-project.js specs/simple-checkout.yaml --out golden/simple-checkout`
    );
    process.exit(1);
  }

  const drift = diffTrees('build', buildA, 'golden', GOLDEN);
  if (drift.length > 0) {
    console.error('\nSnapshot FAILED — build differs from golden/simple-checkout:');
    for (const p of drift) console.error('  - ' + p);
    console.error('\nIf the change is intentional, re-validate and re-promote the golden.');
    process.exit(1);
  }
  console.log('✔ Snapshot: build matches golden/simple-checkout exactly');

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('\nDeterminism harness green.');
}

main();

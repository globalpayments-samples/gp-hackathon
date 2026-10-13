#!/usr/bin/env node
/**
 * Determinism harness.
 *
 * For each spec under test:
 * 1. Builds the spec twice into temp dirs and requires the two outputs to be
 *    byte-identical (same spec → same project, every time).
 * 2. Diffs the build against golden/<name> — the hand-validated expected
 *    output — failing on ANY difference (skipped if golden not yet promoted).
 *
 * Specs under test: simple-checkout, delayed-capture
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { build } = require('./build-project');

const ROOT = path.join(__dirname, '..');

const SPECS_UNDER_TEST = [
  { spec: 'simple-checkout-node.yaml',   golden: 'simple-checkout-node',   required: true  },
  { spec: 'delayed-capture-node.yaml',   golden: 'delayed-capture-node',   required: false },
  { spec: 'gp-api-payment-lifecycle-node.yaml', golden: 'gp-api-payment-lifecycle-node', required: true },
  { spec: 'gp-api-payment-lifecycle-php.yaml', golden: 'gp-api-payment-lifecycle-php', required: true },
  { spec: 'gp-api-payment-lifecycle-dotnet.yaml', golden: 'gp-api-payment-lifecycle-dotnet', required: true },
  { spec: 'gp-api-payment-lifecycle-java.yaml', golden: 'gp-api-payment-lifecycle-java', required: true },
  { spec: 'access-checkout-node.yaml', golden: 'access-checkout-node', required: true },
  { spec: 'tapi-integrated-credit-php.yaml', golden: 'tapi-integrated-credit-php', required: true },
  { spec: 'tapi-integrated-credit-dotnet.yaml', golden: 'tapi-integrated-credit-dotnet', required: true },
  { spec: 'baseplate-gp-api-node.yaml', golden: 'baseplate-gp-api-node', required: true },
  { spec: 'baseplate-gp-api-dotnet.yaml', golden: 'baseplate-gp-api-dotnet', required: true },
  { spec: 'baseplate-gp-api-java.yaml', golden: 'baseplate-gp-api-java', required: true },
  { spec: 'baseplate-access-node.yaml', golden: 'baseplate-access-node', required: true },
  { spec: 'baseplate-tapi-php.yaml', golden: 'baseplate-tapi-php', required: true },
  { spec: 'baseplate-tapi-dotnet.yaml', golden: 'baseplate-tapi-dotnet', required: true },
];

function listFilesRecursive(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['bin', 'node_modules', 'obj', 'target', 'vendor'].includes(entry.name)) continue;
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
  let allGreen = true;

  for (const { spec, golden, required } of SPECS_UNDER_TEST) {
    const specPath   = path.join(ROOT, 'specs', spec);
    const goldenPath = path.join(ROOT, 'golden', golden);
    const buildA     = path.join(tmp, golden + '-a');
    const buildB     = path.join(tmp, golden + '-b');

    build(specPath, buildA);
    build(specPath, buildB);

    const repeatability = diffTrees('first build', buildA, 'second build', buildB);
    if (repeatability.length > 0) {
      console.error(`\nDeterminism BROKEN for ${spec} — same spec produced different output:`);
      for (const p of repeatability) console.error('  - ' + p);
      allGreen = false;
      continue;
    }
    console.log(`✔ Determinism [${spec}]: two builds are byte-identical`);

    if (!fs.existsSync(goldenPath)) {
      if (required) {
        console.error(
          `\nGolden reference missing at golden/${golden}.\n` +
            'Validate a build by hand, then promote it:\n' +
            `  node builder/build-project.js specs/${spec} --out golden/${golden}`
        );
        allGreen = false;
      } else {
        console.log(`  (no golden for ${spec} yet — skipping snapshot diff)`);
      }
      continue;
    }

    const drift = diffTrees('build', buildA, 'golden', goldenPath);
    if (drift.length > 0) {
      console.error(`\nSnapshot FAILED for ${spec} — build differs from golden/${golden}:`);
      for (const p of drift) console.error('  - ' + p);
      console.error('\nIf the change is intentional, re-validate and re-promote the golden.');
      allGreen = false;
    } else {
      console.log(`✔ Snapshot [${spec}]: build matches golden/${golden} exactly`);
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  if (!allGreen) process.exit(1);
  console.log('\nDeterminism harness green.');
}

main();

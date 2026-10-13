#!/usr/bin/env node
/**
 * Builder CLI — deterministic standalone project generation.
 *
 * Usage: node builder/build-project.js <project-spec.yaml> [--out <dir>]
 *
 * Reads a project spec, resolves components and their depends_on closure from
 * the component catalog, and generates a DETACHED, runnable sample project:
 * scaffold copied, core/ and component files vendored, every {{ SLOT }}
 * marker resolved by concatenating insertion fragments in deterministic order
 * (dependency order, then component id alphabetically). Same spec in,
 * byte-identical project out — no timestamps, no random ids, sorted iteration.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const ROOT = path.join(__dirname, '..');
const CATALOG_DIR = path.join(ROOT, 'component_catalog');
const PLATFORMS_DIR = path.join(ROOT, 'platforms');

// Slots that take concatenated insertion fragments.
const FRAGMENT_SLOTS = [
  'IMPORTS',
  'TARGET_BEFORE',
  'TARGET_DURING_1',
  'ROUTE_HANDLERS',
  'WIRING',
  'TARGET_AFTER',
  'FRONTEND_CONFIG',
  'TILE_MARKUP',
  'TILE_SCRIPTS',
  'ASIDE_EXTRAS',
];

// --- GP-branded CLI output (Global Blue #262AFF, brand voice) ---------------
const BLUE = '\x1b[38;2;38;42;255m';
const CHARCOAL = '\x1b[38;2;89;89;89m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const useColor = process.stdout.isTTY;
const paint = (code, text) => (useColor ? code + text + RESET : text);
const banner = () => {
  console.log(paint(BLUE + BOLD, '\nglobal payments') + paint(CHARCOAL, '  ·  Lego system Builder'));
  console.log(paint(CHARCOAL, 'Already on it.\n'));
};
const step = (msg) => console.log(`${paint(BLUE, '▪')} ${msg}`);
const fail = (msg) => {
  if (require.main === module) {
    console.error(`\n${paint(BOLD, 'Build failed:')} ${msg}\n`);
    process.exit(1);
  }
  throw new Error(msg);
};

// --- catalog loading ---------------------------------------------------------
function loadManifest(id) {
  const file = path.join(CATALOG_DIR, `${id}.component.yaml`);
  if (!fs.existsSync(file)) {
    fail(
      `Unknown component "${id}" — no manifest at component_catalog/${id}.component.yaml.\n` +
        'Check the spelling against catalog.json.'
    );
  }
  const manifest = YAML.parse(fs.readFileSync(file, 'utf8'));
  for (const key of ['id', 'layer', 'name', 'description']) {
    if (!manifest[key]) {
      fail(`Manifest for "${id}" is missing required field "${key}".`);
    }
  }
  return manifest;
}

function loadPlatform(id) {
  const file = path.join(PLATFORMS_DIR, `${id}.yaml`);
  if (!fs.existsSync(file)) {
    fail(`Unknown platform "${id}" — no profile at platforms/${id}.yaml.`);
  }
  const platform = YAML.parse(fs.readFileSync(file, 'utf8'));
  for (const key of ['id', 'supported_languages', 'supported_integration_modes', 'default_integration_mode']) {
    if (!platform[key]) fail(`Platform profile "${id}" is missing required field "${key}".`);
  }
  return platform;
}

/**
 * Resolves the requested component ids plus their depends_on closure.
 * Manifests declare dependencies one level deep; resolution follows them
 * iteratively and refuses cycles with a clear error.
 */
function resolveComponents(requestedIds) {
  const resolved = new Map();
  const queue = [...requestedIds].sort();
  while (queue.length > 0) {
    const id = queue.shift();
    if (resolved.has(id)) continue;
    const manifest = loadManifest(id);
    resolved.set(id, manifest);
    for (const dep of [...(manifest.depends_on || [])].sort()) {
      if (!resolved.has(dep)) queue.push(dep);
    }

  }

  // Deterministic topological order: Kahn's algorithm, always taking the
  // lexicographically smallest ready id — dependency order first, then
  // component id alphabetically. Refuses cycles.
  const ids = [...resolved.keys()].sort();
  const remainingDeps = new Map(
    ids.map((id) => [
      id,
      new Set((resolved.get(id).depends_on || []).filter((d) => resolved.has(d))),
    ])
  );
  const ordered = [];
  while (ordered.length < ids.length) {
    const ready = ids.filter((id) => !ordered.includes(id) && remainingDeps.get(id).size === 0);
    if (ready.length === 0) {
      const cycle = ids.filter((id) => !ordered.includes(id));
      fail(
        `Dependency cycle between components: ${cycle.join(' → ')}.\n` +
          'Fix the depends_on entries in their manifests by hand.'
      );
    }
    const next = ready[0];
    ordered.push(next);
    for (const deps of remainingDeps.values()) deps.delete(next);
  }
  return ordered.map((id) => resolved.get(id));
}

function validateV2Compatibility(spec, platform, components) {
  const requested = [...(spec.tiles || []), ...(spec.bricks || []), ...(spec.studs || [])];
  for (const id of requested) {
    if (!id.startsWith('common.') && !id.startsWith(`${platform.id}.`)) {
      fail(
        `Component "${id}" is not namespaced for platform "${platform.id}" ` +
        `(schema_version 2 requires "${platform.id}.*" or "common.*").`
      );
    }
  }
  for (const component of components) {
    // common.* components are cross-platform unless they pin a platform.
    if (component.platform && component.platform !== platform.id) {
      fail(`Component "${component.id}" belongs to platform "${component.platform}", not "${platform.id}".`);
    }
    if (component.integration_mode && !platform.supported_integration_modes.includes(component.integration_mode)) {
      fail(
        `Component "${component.id}" requires integration_mode "${component.integration_mode}", ` +
        `unsupported by platform "${platform.id}".`
      );
    }
    if (component.supported_languages && !component.supported_languages.includes(spec.language)) {
      fail(
        `Component "${component.id}" has no "${spec.language}" implementation ` +
        `(supported: ${component.supported_languages.join(', ')}).`
      );
    }
    if (component.region && spec.region && !component.region.includes(spec.region)) {
      fail(`Component "${component.id}" is not applicable in region "${spec.region}".`);
    }
    if (!Array.isArray(component.test_strategy) || component.test_strategy.length === 0) {
      fail(`Component "${component.id}" has no declared test_strategy.`);
    }
  }
}

// --- helpers -----------------------------------------------------------------
function titleCase(name) {
  const words = name.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function listFilesRecursive(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['bin', 'node_modules', 'obj', 'target', 'vendor'].includes(entry.name)) continue;
      out.push(...listFilesRecursive(full, base));
    }
    else out.push(path.relative(base, full));
  }
  return out;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

/** Strips optional {{ TARGET_BEFORE }} / {{ TARGET_AFTER }} wrapper lines from a fragment. */
function stripMarkers(text) {
  return text
    .split('\n')
    .filter((line) => !/^\s*\{\{\s*TARGET_(BEFORE|AFTER)\s*\}\}\s*$/.test(line))
    .join('\n')
    .trim();
}

/**
 * Resolves slot markers in a template string.
 * - fragment slots: a line holding only {{ SLOT }} is replaced by the
 *   concatenated fragments (re-indented to the marker's indentation), or
 *   dropped when the slot is unused;
 * - value placeholders: replaced inline.
 */
function renderTemplate(text, fragmentsBySlot, values) {
  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    const slotMatch = line.match(/^(\s*)\{\{\s*([A-Z0-9_]+)\s*\}\}\s*$/);
    if (slotMatch && FRAGMENT_SLOTS.includes(slotMatch[2])) {
      const indent = slotMatch[1];
      const slotName = slotMatch[2];
      const fragments = fragmentsBySlot.get(slotName) || [];
      if (fragments.length === 0) continue; // unused slot resolves to empty
      let body = fragments.join('\n\n');
      if (slotName === 'IMPORTS') {
        const seen = new Set();
        body = body.split('\n').filter(l => {
          const t = l.trim();
          if (!t) return true;
          if (seen.has(t)) return false;
          seen.add(t);
          return true;
        }).join('\n');
      }
      for (const bodyLine of body.split('\n')) {
        out.push(bodyLine.length > 0 ? indent + bodyLine : '');
      }
      continue;
    }
    out.push(
      line.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, name) => {
        if (Object.prototype.hasOwnProperty.call(values, name)) return values[name];
        if (FRAGMENT_SLOTS.includes(name)) return ''; // inline fragment slot: unused
        fail(`Template references unknown placeholder {{ ${name} }}.`);
      })
    );
  }
  // Collapse the blank-line runs left behind by empty slots.
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// --- language-keyed manifest helpers ----------------------------------------

/**
 * Resolves a manifest field that may be either:
 *   - a flat Array/Object (legacy — treated as node-only, returned as-is for 'node',
 *     empty for any other language), OR
 *   - a language-keyed Object { node: ..., php: ..., etc. } — the entry for
 *     `language` is selected and returned.
 *
 * @param {Array|Object} field  The raw manifest value for 'files' or 'inserts'.
 * @param {string}       language  The target language from the spec.
 * @param {Array|Object} emptyValue  Default when no entry exists ([] or {}).
 */
function resolveForLanguage(field, language, emptyValue) {
  if (!field) return emptyValue;
  if (Array.isArray(field)) {
    // Flat array — node-only shorthand.
    return language === 'node' ? field : emptyValue;
  }
  // Object — check if it's language-keyed (values are arrays or objects)
  // vs. the flat inserts map (values are slot name strings).
  const firstValue = Object.values(field)[0];
  if (typeof firstValue === 'string') {
    // Flat inserts map { 'path/file.js': 'SLOT_NAME' } — node-only shorthand.
    return language === 'node' ? field : emptyValue;
  }
  // Language-keyed map { node: ..., php: ... } — select by language.
  return field[language] ?? emptyValue;
}

function languageKeys(field) {
  if (!field || Array.isArray(field)) return [];
  const firstValue = Object.values(field)[0];
  if (typeof firstValue === 'string') return [];
  return Object.keys(field).sort();
}

function resolveConfigForLanguage(field, language) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return field[language] || [];
}

function renderDependencyJson(platform, language) {
  const dependencies = platform.dependencies?.[language]?.dependencies || {};
  return JSON.stringify(Object.fromEntries(Object.entries(dependencies).sort()), null, 4)
    .split('\n')
    .map((line, index) => (index === 0 ? line : '    ' + line))
    .join('\n');
}

function componentTable(components) {
  if (components.length === 0) {
    return '| Component | Layer | Description |\n| --- | --- | --- |\n| Baseplate only | baseplate | Platform scaffold without optional components. |';
  }
  return [
    '| Component | Layer | Description |',
    '| --- | --- | --- |',
    ...components.map((c) => `| ${c.id} | ${c.layer} | ${c.description} |`),
  ].join('\n');
}

function collectTemplateValues(spec, platform, components, configVars) {
  const title = titleCase(spec.name);
  return {
    PROJECT_NAME: spec.name,
    PROJECT_TITLE: title,
    PLATFORM_ID: platform.id,
    PLATFORM_NAME: platform.display_name || platform.id,
    LANGUAGE: spec.language,
    REGION: spec.region || 'unconfirmed',
    PERSONA: spec.persona || 'developer',
    COMPONENT_SUMMARY: components.length ? components.map((c) => `${c.name} (${c.layer})`).join(', ') : 'Baseplate only',
    COMPONENT_TABLE: componentTable(components),
    SEQUENCE: components.length ? components.map((c, i) => `${i + 1}. **${c.name}** — ${c.description}.`).join('\n') : '1. **Baseplate** — platform-specific scaffold, health check, metadata, Docker assets, and deterministic tests.',
    CONFIG_VARS: configVars.length ? configVars.map((v) => `- \`${v}\``).join('\n') : '- None',
    CONFIG_ENV: configVars.map((v) => `${v}=`).join('\n') + (configVars.length ? '\n' : ''),
    CONFIG_ARRAY: JSON.stringify(configVars),
    CONFIG_CS_ARRAY: configVars.map((v) => `"${v}"`).join(', '),
    CONFIG_JAVA_ARRAY: configVars.map((v) => `"${v}"`).join(', '),
    DEPENDENCIES_JSON: renderDependencyJson(platform, spec.language),
    COMPONENT_IDS: components.map((c) => c.id).join(','),
  };
}

function validateV2ManifestShape(component, language) {
  for (const key of ['files', 'inserts', 'config_required', 'test_fragments']) {
    if (!Object.prototype.hasOwnProperty.call(component, key)) {
      fail(`Manifest for "${component.id}" is missing required schema-v2 field "${key}".`);
    }
  }
  if (!Array.isArray(component.config_required) && typeof component.config_required !== 'object') {
    fail(`Manifest for "${component.id}" must declare config_required as an array or language-keyed object.`);
  }
  if (!Array.isArray(component.config_required) && !Object.prototype.hasOwnProperty.call(component.config_required, language)) {
    fail(`Manifest for "${component.id}" has no language-keyed config_required entry for "${language}".`);
  }
  if (!languageKeys(component.files).includes(language)) {
    fail(`Manifest for "${component.id}" has no language-keyed files entry for "${language}".`);
  }
  if (!languageKeys(component.inserts).includes(language)) {
    fail(`Manifest for "${component.id}" has no language-keyed inserts entry for "${language}".`);
  }
  if (!languageKeys(component.test_fragments).includes(language)) {
    fail(`Manifest for "${component.id}" has no language-keyed test_fragments entry for "${language}".`);
  }
}

function buildV2({ spec, platform, components, outOverride, root }) {
  const scaffoldDir = path.join(root, 'scaffold', 'v2', platform.id, spec.language);
  if (!fs.existsSync(scaffoldDir)) {
    fail(
      `V2 ${platform.id}/${spec.language} is not supported by a verified executable scaffold. ` +
      'Check the platform profile and scaffold/v2 for verified schema-v2 anchors.'
    );
  }

  const outDir = outOverride || path.join(root, 'output', spec.name);
  fs.rmSync(outDir, { recursive: true, force: true });

  const fragmentsBySlot = new Map();
  for (const component of components) {
    validateV2ManifestShape(component, spec.language);
    const inserts = resolveForLanguage(component.inserts, spec.language, {});
    for (const fragmentPath of Object.keys(inserts).sort()) {
      const slot = inserts[fragmentPath];
      if (!FRAGMENT_SLOTS.includes(slot)) {
        fail(`Component "${component.id}" targets unknown slot "${slot}" (fragment ${fragmentPath}).`);
      }
      const full = path.join(root, fragmentPath);
      if (!fs.existsSync(full)) fail(`Component "${component.id}" lists missing fragment file: ${fragmentPath}`);
      if (!fragmentsBySlot.has(slot)) fragmentsBySlot.set(slot, []);
      fragmentsBySlot.get(slot).push(stripMarkers(fs.readFileSync(full, 'utf8')));
    }
  }

  const configVars = [...new Set([
    ...resolveConfigForLanguage(platform.config_required, spec.language),
    ...components.flatMap((c) => resolveConfigForLanguage(c.config_required, spec.language)),
  ])].sort();
  const values = collectTemplateValues(spec, platform, components, configVars);

  const textExtensions = new Set([
    '.js', '.json', '.md', '.html', '.css', '.yaml', '.yml', '.php', '.sh',
    '.xml', '.txt', '.example', '.cs', '.csproj', '.java', '.properties',
  ]);
  for (const rel of listFilesRecursive(scaffoldDir)) {
    const src = path.join(scaffoldDir, rel);
    const dest = path.join(outDir, rel);
    if (textExtensions.has(path.extname(rel)) || rel === '.env.example' || rel === 'Dockerfile') {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, renderTemplate(fs.readFileSync(src, 'utf8'), fragmentsBySlot, values));
    } else {
      copyFile(src, dest);
    }
  }

  const vendored = new Map();
  const vendor = (srcRel, destRel = srcRel) => {
    const existing = vendored.get(destRel);
    if (existing && existing !== srcRel) fail(`Vendoring collision: ${existing} and ${srcRel} both map to ${destRel}.`);
    if (existing) return;
    const src = path.join(root, srcRel);
    if (!fs.existsSync(src)) fail(`Listed file does not exist: ${srcRel}`);
    copyFile(src, path.join(outDir, destRel));
    vendored.set(destRel, srcRel);
  };

  for (const component of components) {
    for (const file of [...resolveForLanguage(component.files, spec.language, [])].sort()) {
      vendor(file);
    }
    for (const asset of [...(component.assets || [])].sort()) {
      vendor(asset);
    }
    for (const testFile of [...resolveForLanguage(component.test_fragments, spec.language, [])].sort()) {
      const marker = '/tests/';
      const idx = testFile.indexOf(marker);
      if (idx === -1) fail(`test_fragments entry must live under a tests/ directory: ${testFile}`);
      let testRel = testFile.slice(idx + marker.length);
      if (testRel.startsWith(`${spec.language}/`)) testRel = testRel.slice(spec.language.length + 1);
      vendor(testFile, path.posix.join('tests', testRel));
    }
  }

  step(`V2 ${platform.id}/${spec.language} scaffold composed from ${components.length || 'baseplate-only'} component(s)`);
  return outDir;
}


function build(specPath, outOverride) {
  if (!fs.existsSync(specPath)) {
    fail(`Spec file not found: ${specPath}`);
  }
  const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));
  for (const key of ['name', 'language']) {
    if (!spec[key]) fail(`Spec is missing required field "${key}".`);
  }
  const schemaVersion = spec.schema_version || 1;
  if (![1, 2].includes(schemaVersion)) fail(`Unsupported schema_version "${schemaVersion}".`);
  if (schemaVersion === 2 && !spec.platform) fail('schema_version 2 requires "platform".');
  const platform = loadPlatform(schemaVersion === 1 ? 'gp-api' : spec.platform);
  const SUPPORTED_LANGUAGES = schemaVersion === 2
    ? (platform.v2_supported_languages || platform.supported_languages)
    : platform.supported_languages;
  if (!SUPPORTED_LANGUAGES.includes(spec.language)) {
    fail(`Unsupported language "${spec.language}" for platform "${platform.id}" — supported: ${SUPPORTED_LANGUAGES.join(', ')}.`);
  }
  const integrationMode = spec.integration_mode || platform.default_integration_mode;
  if (!platform.supported_integration_modes.includes(integrationMode)) {
    fail(
      `Unsupported integration_mode "${integrationMode}" for platform "${platform.id}" — ` +
      `supported: ${platform.supported_integration_modes.join(', ')}.`
    );
  }

  const requested = [...(spec.tiles || []), ...(spec.bricks || []), ...(spec.studs || [])];
  if (requested.length === 0 && schemaVersion === 1) {
    fail('Spec selects no tiles or bricks — nothing to compose.');
  }

  banner();
  step(`Spec: ${path.relative(process.cwd(), specPath)} → project "${spec.name}"`);

  const components = resolveComponents(requested);
  if (schemaVersion === 2) {
    validateV2Compatibility(spec, platform, components);
    return buildV2({ spec, platform, components, outOverride, root: ROOT });
  }
  step(`Components (dependency order): ${components.map((c) => c.id).join(', ')}`);

  const scaffoldDir = path.join(ROOT, 'scaffold', spec.language);
  const outDir = outOverride || path.join(ROOT, 'output', spec.name);
  fs.rmSync(outDir, { recursive: true, force: true });

  // 1. Scaffold as the base.
  const scaffoldFiles = listFilesRecursive(scaffoldDir);

  // 2. Collect fragments per slot in deterministic component order.
  const fragmentsBySlot = new Map();
  for (const component of components) {
    const inserts = resolveForLanguage(component.inserts, spec.language, {});
    for (const fragmentPath of Object.keys(inserts).sort()) {
      const slot = inserts[fragmentPath];
      if (!FRAGMENT_SLOTS.includes(slot)) {
        fail(`Component "${component.id}" targets unknown slot "${slot}" (fragment ${fragmentPath}).`);
      }
      const full = path.join(ROOT, fragmentPath);
      if (!fs.existsSync(full)) {
        fail(`Component "${component.id}" lists missing fragment file: ${fragmentPath}`);
      }
      const body = stripMarkers(fs.readFileSync(full, 'utf8'));
      if (!fragmentsBySlot.has(slot)) fragmentsBySlot.set(slot, []);
      fragmentsBySlot.get(slot).push(body);
    }
  }

  // 3. Computed values for inline placeholders.
  const title = titleCase(spec.name);
  const configVars = [...new Set(components.flatMap((c) => c.config_required || []))].sort();
  const values = {
    PROJECT_NAME: spec.name,
    PROJECT_TITLE: title,
    COMPONENT_SUMMARY: components.map((c) => `${c.name} (${c.layer})`).join(', '),
    COMPONENT_TABLE: [
      '| Component | Layer | Description |',
      '| --- | --- | --- |',
      ...components.map((c) => `| ${c.name} | ${c.layer} | ${c.description} |`),
    ].join('\n'),
    SEQUENCE: components.map((c, i) => `${i + 1}. **${c.name}** — ${c.description}.`).join('\n'),
    CONFIG_VARS: configVars.map((v) => `- \`${v}\``).join('\n'),
    COMPONENT_CHIPS: components
      .map(
        (c) =>
          `<li class="gp-chip"><span class="gp-chip-dot gp-chip-dot--${c.layer}"></span>` +
          `<span class="gp-chip-name">${c.name}</span><span class="gp-chip-layer">${c.layer}</span></li>`
      )
      .join('\n      '),
  };

  // 4. Render scaffold files into the output project.
  const textExtensions = new Set(['.js', '.json', '.md', '.html', '.css', '.yaml', '.yml', '.php', '.sh', '.cs', '.java', '.xml', '.csproj', '.properties']);
  for (const rel of scaffoldFiles) {
    const src = path.join(scaffoldDir, rel);
    const dest = path.join(outDir, rel);
    if (textExtensions.has(path.extname(rel))) {
      const rendered = renderTemplate(fs.readFileSync(src, 'utf8'), fragmentsBySlot, values);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, rendered);
    } else {
      copyFile(src, dest);
    }
  }
  step('Scaffold rendered, slots resolved');

  // 5. Vendor core/ — the Node baseplate travels with every Node project.
  // PHP, .NET, and Java bake core/ into the scaffold; no separate vendoring needed.
  if (spec.language === 'node') {
    for (const rel of listFilesRecursive(path.join(ROOT, 'core'))) {
      copyFile(path.join(ROOT, 'core', rel), path.join(outDir, 'core', rel));
    }
  }

  // 6. Vendor component modules, frontend assets, and test fragments.
  const vendored = new Map(); // dest -> src, to refuse basename collisions
  const vendor = (srcRel, destRel) => {
    const existing = vendored.get(destRel);
    if (existing && existing !== srcRel) {
      fail(`Vendoring collision: ${existing} and ${srcRel} both map to ${destRel}.`);
    }
    if (!existing) {
      const full = path.join(ROOT, srcRel);
      if (!fs.existsSync(full)) fail(`Listed file does not exist: ${srcRel}`);
      copyFile(full, path.join(outDir, destRel));
      vendored.set(destRel, srcRel);
    }
  };
  for (const component of components) {
    for (const file of [...resolveForLanguage(component.files, spec.language, [])].sort()) {
      let destRel;
      if (spec.language === 'java') {
        destRel = path.posix.join('src/main/java/com/globalpayments/sample', path.posix.basename(file));
      } else {
        destRel = path.posix.join('components', path.posix.basename(file));
      }
      vendor(file, destRel);
    }
    for (const asset of [...(component.assets || [])].sort()) {
      vendor(asset, path.posix.join('public', 'components', path.posix.basename(asset)));
    }
    for (const testFile of [...resolveForLanguage(component.test_fragments, spec.language, [])].sort()) {
      const marker = '/tests/';
      const idx = testFile.indexOf(marker);
      if (idx === -1) fail(`test_fragments entry must live under a tests/ directory: ${testFile}`);
      vendor(testFile, path.posix.join('tests', testFile.slice(idx + marker.length)));
    }
  }
  step('Vendored core/, components/, assets, and tests — fully detached');

  // 7. .env.example from the union of config_required.
  fs.writeFileSync(
    path.join(outDir, '.env.example'),
    configVars.map((v) => `${v}=`).join('\n') + '\n'
  );

  // 8. Next steps, in brand voice.
  const relOut = path.relative(process.cwd(), outDir);
  const nextSteps = {
    node: [
      '  npm install',
      '  npm start              # branded checkout on http://localhost:3000',
      '  npm test               # sandbox integration tests',
    ],
    php: [
      '  composer install',
      '  php -S 0.0.0.0:3000 router.php  # branded checkout on http://localhost:3000',
      '  ./vendor/bin/phpunit tests/      # smoke tests (skip without credentials)',
    ],
    dotnet: [
      '  dotnet restore',
      '  dotnet run             # branded checkout on http://localhost:3000',
      '  dotnet test            # sandbox integration tests',
    ],
    java: [
      '  mvn dependency:resolve',
      '  mvn integration-test   # builds + starts embedded Tomcat on http://localhost:3000',
      '  mvn test               # unit tests',
    ],
  };
  console.log(`\n${paint(BLUE + BOLD, 'Done.')} Standalone project at ${paint(BOLD, relOut)}\n`);
  console.log(paint(CHARCOAL, 'Next steps:'));
  console.log(`  cd ${relOut}`);
  console.log('  cp .env.example .env   # fill in: ' + configVars.join(', '));
  for (const line of (nextSteps[spec.language] || nextSteps.node)) {
    console.log(line);
  }
  console.log('');
  return outDir;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const outFlag = args.indexOf('--out');
  const outOverride = outFlag !== -1 ? path.resolve(args[outFlag + 1]) : undefined;
  const specArg = args.filter((a, i) => outFlag === -1 || (i !== outFlag && i !== outFlag + 1))[0];
  if (!specArg) {
    fail('Usage: node builder/build-project.js <project-spec.yaml> [--out <dir>]');
  }
  build(path.resolve(specArg), outOverride);
}

module.exports = { build, resolveComponents, loadPlatform, validateV2Compatibility };

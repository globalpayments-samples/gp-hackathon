'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { build } = require('./build-project');

const ROOT = path.join(__dirname, '..');

test('schema v2 anchors generate detached, platform-specific assets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-v2-test-'));
  try {
    const output = build(path.join(ROOT, 'specs', 'access-checkout-node.yaml'), path.join(root, 'access'));
    for (const file of ['.env.example', 'README.md', 'AGENTS.md', 'llms.txt', 'portal.meta.yaml', 'Dockerfile', 'docker-compose.yml', 'tests/contract.js']) {
      assert.ok(fs.existsSync(path.join(output, file)), `${file} is generated`);
    }
    const source = fs.readFileSync(path.join(output, 'index.js'), 'utf8');
    assert.match(source, /ACCESS_MERCHANT_KEY/);
    assert.doesNotMatch(source, /GpApiConfig|globalpayments-api/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('v1 generation remains byte-identical to the existing golden', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-v1-test-'));
  try {
    const output = build(path.join(ROOT, 'specs', 'simple-checkout-node.yaml'), path.join(root, 'v1'));
    assert.deepEqual(
      fs.readFileSync(path.join(output, 'package.json')),
      fs.readFileSync(path.join(ROOT, 'golden/simple-checkout-node/package.json'))
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('schema v2 rejects components, languages, and regions outside a platform profile', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-v2-negative-'));
  const cases = [
    ['bad-namespace.yaml', 'platform "access"', 'bricks: [gp-api.payment.authorize]'],
    ['bad-language.yaml', 'Unsupported language "java" for platform "access"', 'language: java'],
    ['bad-region.yaml', 'not applicable in region "US"', 'region: US'],
  ];
  try {
    for (const [name, expected, replacement] of cases) {
      const source = fs.readFileSync(path.join(ROOT, 'specs', 'access-checkout-node.yaml'), 'utf8');
      const altered = replacement.startsWith('bricks:')
        ? source.replace(/^bricks:.*$/m, replacement)
        : replacement.startsWith('language:')
          ? source.replace(/^language:.*$/m, replacement)
          : source.replace(/^region:.*$/m, replacement);
      const specPath = path.join(root, name);
      fs.writeFileSync(specPath, altered);
      assert.throws(() => build(specPath, path.join(root, name + '.out')), new RegExp(expected));
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('schema v2 supports baseplate-only generation for verified anchors', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-v2-baseplate-'));
  try {
    for (const spec of [
      'baseplate-gp-api-node.yaml',
      'baseplate-gp-api-dotnet.yaml',
      'baseplate-gp-api-java.yaml',
      'baseplate-access-node.yaml',
      'baseplate-tapi-php.yaml',
      'baseplate-tapi-dotnet.yaml',
    ]) {
      const output = build(path.join(ROOT, 'specs', spec), path.join(root, spec.replace(/\.yaml$/, '')));
      assert.ok(fs.existsSync(path.join(output, '.env.example')));
      assert.ok(fs.existsSync(path.join(output, 'README.md')));
      assert.equal(fs.existsSync(path.join(output, 'bin')), false);
      assert.equal(fs.existsSync(path.join(output, 'obj')), false);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('TAPI projects share credential names and PHP protocol defaults', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-v2-tapi-config-'));
  try {
    const php = build(path.join(ROOT, 'specs', 'tapi-integrated-credit-php.yaml'), path.join(root, 'php'));
    const phpEnv = fs.readFileSync(path.join(php, '.env.example'), 'utf8');
    const phpSource = fs.readFileSync(path.join(php, 'index.php'), 'utf8');
    for (const name of ['TAPI_ACCOUNT_CREDENTIAL', 'TAPI_API_KEY', 'TAPI_API_SECRET', 'TAPI_REGION']) {
      assert.match(phpEnv, new RegExp(`^${name}=`, 'm'));
    }
    assert.match(phpEnv, /^TAPI_API_VERSION=2021-04-08$/m);
    assert.match(phpEnv, /^TAPI_PARTNER_NAME=tapi-integrated-credit-php$/m);
    assert.match(phpSource, /country = getenv\('TAPI_REGION'\)/);
    assert.match(phpSource, /apiVersion = getenv\('TAPI_API_VERSION'\) \?: '2021-04-08'/);

    const dotnet = build(path.join(ROOT, 'specs', 'tapi-integrated-credit-dotnet.yaml'), path.join(root, 'dotnet'));
    const dotnetEnv = fs.readFileSync(path.join(dotnet, '.env.example'), 'utf8');
    const dotnetSource = fs.readFileSync(path.join(dotnet, 'baseplate', 'GatewayConfig.cs'), 'utf8');
    assert.match(dotnetEnv, /^TAPI_API_SECRET=$/m);
    assert.doesNotMatch(dotnetEnv, /TAPI_APP_SECRET/);
    assert.match(dotnetSource, /GetEnvironmentVariable\("TAPI_API_SECRET"\)/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('unapproved schema v2 TAPI Java remains catalog-unsupported', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gp-v2-tapi-java-'));
  try {
    const specPath = path.join(root, 'tapi-java.yaml');
    fs.writeFileSync(specPath, [
      'schema_version: 2',
      'name: tapi-integrated-credit-java',
      'platform: tapi',
      'language: java',
      'integration_mode: server-sdk',
      'region: US',
      'bricks: [tapi.credit.sale]',
      '',
    ].join('\n'));
    assert.throws(
      () => build(specPath, path.join(root, 'out')),
      /Unsupported language "java" for platform "tapi".*supported: php, dotnet/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

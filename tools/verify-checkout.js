#!/usr/bin/env node
/**
 * Chrome DevTools verification for generated checkout pages.
 *
 * Usage: node tools/verify-checkout.js <url> [--capture] [--shot <path>]
 *
 * Drives the system Chrome over the DevTools Protocol (puppeteer-core):
 *  1. collects console errors / page errors / failed requests,
 *  2. measures rendered geometry of every field (alignment, widths, heights),
 *  3. fills the GP hosted-field iframes with the sandbox card and submits,
 *  4. asserts a successful transaction renders (and capture, with --capture),
 *  5. saves a full-page screenshot.
 */
'use strict';

const puppeteer = require('puppeteer-core');

const url = process.argv[2] || 'http://localhost:3000/';
const doCapture = process.argv.includes('--capture');
const shotFlag = process.argv.indexOf('--shot');
const shotPath = shotFlag !== -1 ? process.argv[shotFlag + 1] : '/tmp/verify-checkout.png';

const problems = [];
const note = (ok, msg) => {
  console.log(`${ok ? '✔' : '✘'} ${msg}`);
  if (!ok) problems.push(msg);
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--window-size=1280,1400',
      // software WebGL so the 3D flow scene is exercised even without a GPU
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
    defaultViewport: { width: 1280, height: 1400 },
  });
  const origin = new URL(url).origin;
  await browser.defaultBrowserContext().overridePermissions(origin, [
    'clipboard-read',
    'clipboard-write',
    'clipboard-sanitized-write',
  ]);
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));
  page.on('requestfailed', (req) => {
    const failure = req.failure() ? req.failure().errorText : 'failed';
    if (!failure.includes('ERR_ABORTED')) consoleErrors.push(`request failed: ${req.url()} (${failure})`);
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. Hosted fields ready
  await page.waitForFunction(
    () => document.getElementById('gp-status').textContent.includes('Ready'),
    { timeout: 20000 }
  );
  note(true, 'hosted fields initialized (status: Ready)');

  // 2. Geometry — all field boxes must share left/right edges per column,
  //    half-width fields must match each other, heights must be exact.
  const geo = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) };
    };
    return {
      amount: box('#gp-amount'),
      number: box('#gp-card-number'),
      expiry: box('#gp-card-expiration'),
      cvv: box('#gp-card-cvv'),
      holder: box('#gp-card-holder'),
      submit: box('#gp-card-submit'),
    };
  });
  for (const [name, b] of Object.entries(geo)) {
    if (!b) note(false, `field missing from DOM: ${name}`);
  }
  const fullWidth = [geo.amount, geo.number, geo.holder, geo.submit];
  note(fullWidth.every((b) => b.x === geo.number.x && b.right === geo.number.right),
    `full-width fields share identical left/right edges (x=${geo.number.x}, right=${geo.number.right})`);
  note(geo.expiry.x === geo.number.x,
    `expiry aligns with the left column edge (x=${geo.expiry.x})`);
  note(geo.cvv.right === geo.number.right,
    `CVV aligns with the right column edge (right=${geo.cvv.right})`);
  note(geo.expiry.w === geo.cvv.w,
    `expiry and CVV have equal widths (${geo.expiry.w}px vs ${geo.cvv.w}px)`);
  note(geo.number.h === 48 && geo.expiry.h === 48 && geo.cvv.h === 48 && geo.holder.h === 48,
    `card fields are exactly 48px tall (number=${geo.number.h}, expiry=${geo.expiry.h}, cvv=${geo.cvv.h}, holder=${geo.holder.h})`);
  note(geo.submit.h === 52, `submit button is exactly 52px tall (${geo.submit.h})`);

  // 1b. Architecture flow animation: WebGL scene built from the component chips.
  await page.waitForFunction(() => window.__gpFlow && window.__gpFlow.ready, { timeout: 15000 });
  const flow = await page.evaluate(() => {
    const canvas = document.getElementById('gp-flow-canvas');
    const r = canvas.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), gsap: !!window.gsap, webgl: window.__gpFlow.webgl };
  });
  note(flow.webgl, 'WebGL flow scene active (not the DOM fallback)');
  note(flow.w > 100 && flow.h >= 200, `flow canvas rendered at ${flow.w}×${flow.h}`);
  note(flow.gsap, 'GSAP loaded');

  // Brand header: logo image loaded, no text wordmark remains.
  const header = await page.evaluate(() => {
    const img = document.querySelector('.gp-logo');
    return {
      loaded: !!img && img.naturalWidth > 0,
      wordmarkGone: !document.querySelector('.gp-wordmark'),
    };
  });
  note(header.loaded, 'Global Payments logo loaded in the header');
  note(header.wordmarkGone, 'text wordmark removed');

  // 1c. Performance budget (Chrome DevTools metrics).
  const perf = await page.evaluate(async () => {
    const nav = performance.getEntriesByType('navigation')[0];
    const lcp = await new Promise((resolve) => {
      const entries = [];
      new PerformanceObserver((list) => entries.push(...list.getEntries()))
        .observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => resolve(entries.length ? entries[entries.length - 1].startTime : 0), 300);
    });
    const fps = await new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      (function tick() {
        frames += 1;
        if (performance.now() - start < 1500) requestAnimationFrame(tick);
        else resolve(Math.round((frames / (performance.now() - start)) * 1000));
      })();
    });
    return {
      dcl: Math.round(nav.domContentLoadedEventEnd),
      load: Math.round(nav.loadEventEnd),
      lcp: Math.round(lcp),
      fps,
    };
  });
  note(perf.dcl < 1500, `DOMContentLoaded in ${perf.dcl}ms (< 1500ms budget)`);
  note(perf.lcp > 0 && perf.lcp < 2500, `LCP in ${perf.lcp}ms (< 2500ms budget)`);
  // ≥25fps is the floor for SwiftShader software WebGL; hardware GPUs run 60.
  note(perf.fps >= 25, `animation holds ${perf.fps} fps (≥ 25 software-rendering budget)`);

  // 2a. Pre-payment state: the result panel must be invisible until a payment runs.
  const resultVisible = await page.evaluate(() => {
    const el = document.getElementById('gp-result');
    return getComputedStyle(el).display !== 'none';
  });
  note(!resultVisible, 'result panel hidden before any payment');

  // 2b. Aside rail: component chips, test-card panel, copy button, docs link.
  const aside = await page.evaluate(() => {
    const chips = document.querySelectorAll('.gp-chips .gp-chip').length;
    const testcard = !!document.querySelector('.gp-testcard');
    const cardNumberText = document.getElementById('gp-testcard-number')?.textContent.replace(/\s/g, ' ');
    const link = document.querySelector('.gp-aside-note a')?.href;
    const copyBtn = !!document.getElementById('gp-copy-card');
    return { chips, testcard, cardNumberText, link, copyBtn };
  });
  note(aside.chips > 0, `component chips rendered (${aside.chips})`);
  note(aside.testcard, 'sandbox test-card visual rendered');
  note(aside.link === 'https://developer.globalpayments.com/resources/test-cards',
    `test-cards docs link points to developer portal (${aside.link})`);
  note(aside.copyBtn, 'copy button present');

  await page.click('#gp-copy-card');
  await new Promise((r) => setTimeout(r, 300));
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  note(copied === '4263970000005262', `copy button puts the raw card number on the clipboard ("${copied}")`);
  const copyLabel = await page.evaluate(() => document.getElementById('gp-copy-card').textContent.trim());
  note(copyLabel.includes('Copied'), `copy button shows feedback ("${copyLabel}")`);

  // 3. Fill the hosted-field iframes with the sandbox card.
  const typeInto = async (targetId, value) => {
    const iframe = await page.waitForSelector(`#${targetId} iframe`, { timeout: 10000 });
    const frame = await iframe.contentFrame();
    const input = await frame.waitForSelector('input', { timeout: 10000 });
    await input.click();
    await input.type(value, { delay: 20 });
  };
  await typeInto('gp-card-number', '4263970000005262');
  await typeInto('gp-card-expiration', '122030'); // the field mask inserts " / "
  await typeInto('gp-card-cvv', '123');
  await typeInto('gp-card-holder', 'Lego Tester');
  note(true, 'sandbox card entered into hosted-field iframes');

  const submitIframe = await page.$('#gp-card-submit iframe');
  const submitFrame = await submitIframe.contentFrame();
  const submitButton = await submitFrame.waitForSelector('button', { timeout: 5000 });
  const submitLabel = await submitFrame.evaluate(() => document.querySelector('button').textContent.trim());
  note(true, `submit button label: "${submitLabel}"`);
  await submitButton.click();

  // 4. Wait for the transaction result (or surface the on-page error).
  try {
    await page.waitForFunction(
      () => !document.getElementById('gp-result').hidden
        || document.getElementById('gp-status').className.includes('error'),
      { timeout: 30000 }
    );
  } catch (err) {
    // fall through; the status read below reports what the page showed
  }
  const statusText = await page.evaluate(() => document.getElementById('gp-status').textContent);
  const resultHidden = await page.evaluate(() => document.getElementById('gp-result').hidden);
  if (resultHidden) {
    await page.screenshot({ path: shotPath, fullPage: true });
    note(false, `no transaction result; page status: "${statusText}" (screenshot: ${shotPath})`);
    await browser.close();
    process.exit(1);
  }
  const firstResult = await page.evaluate(() => {
    const dds = [...document.querySelectorAll('#gp-result dd')].map((d) => d.textContent);
    return { transactionId: dds[0], status: dds[1], responseCode: dds[2] };
  });
  note(firstResult.responseCode === 'SUCCESS',
    `transaction succeeded: ${firstResult.status} (${firstResult.transactionId})`);

  if (doCapture) {
    note(firstResult.status === 'PREAUTHORIZED', `funds held before capture (${firstResult.status})`);
    const captureButton = await page.waitForSelector('#gp-actions button', { timeout: 10000 });
    await captureButton.click();
    await page.waitForFunction(
      () => [...document.querySelectorAll('#gp-result dd')][1]?.textContent === 'CAPTURED',
      { timeout: 30000 }
    );
    note(true, 'delayed capture completed: status CAPTURED');
  }

  // 4b. Flow animation phases fired, pieces pulsed, and the narration finished
  //     (the success caption lands only after the token completes its journey).
  await page.waitForFunction(
    () => (window.__gpFlow.captions || []).some((c) => c.includes('Approved')),
    { timeout: 20000 }
  );
  const flowState = await page.evaluate(() => window.__gpFlow);
  note(flowState.phases.includes('pay') && flowState.phases.includes('success'),
    `flow animation phases fired (${flowState.phases.join(' → ')})`);
  if (doCapture) {
    note(flowState.phases.includes('capture'), 'capture phase animated');
  }
  note(flowState.pulses.length > 0, `lego pieces pulsed: ${[...new Set(flowState.pulses)].join(', ')}`);
  const captions = flowState.captions || [];
  note(captions.some((c) => /Step 1 of \d/.test(c)) && captions.some((c) => /Approved/.test(c)),
    `flow narrated ${captions.length} captions, ending with: "${captions[captions.length - 1] || ''}"`);

  // 5. Console hygiene + screenshot.
  note(consoleErrors.length === 0,
    consoleErrors.length === 0 ? 'no console errors, page errors, or failed requests'
      : `console issues:\n    ${consoleErrors.join('\n    ')}`);

  await page.screenshot({ path: shotPath, fullPage: true });
  console.log(`screenshot: ${shotPath}`);

  // 6. Mobile viewport: fresh page load at 390px — layout must collapse to one
  //    column, no horizontal overflow, hosted fields must render.
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844 });
  await mobilePage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await mobilePage.waitForFunction(
    () => document.getElementById('gp-status').textContent.includes('Ready'),
    { timeout: 20000 }
  );
  const mobile = await mobilePage.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const layout = getComputedStyle(document.querySelector('.gp-layout')).gridTemplateColumns.split(' ').length;
    const iframes = [...document.querySelectorAll('.gp-hf-target iframe')].map((f) => {
      const r = f.getBoundingClientRect();
      return Math.round(r.height);
    });
    return { overflow, columns: layout, iframes };
  });
  note(mobile.overflow <= 0, `no horizontal overflow at 390px (overflow=${mobile.overflow}px)`);
  note(mobile.columns === 1, `layout collapses to one column on mobile (${mobile.columns})`);
  note(mobile.iframes.length >= 5 && mobile.iframes.every((h) => h >= 48),
    `all hosted-field iframes render on mobile (heights: ${mobile.iframes.join(', ')})`);
  const mobileShot = shotPath.replace(/\.png$/, '-mobile.png');
  await mobilePage.screenshot({ path: mobileShot, fullPage: true });
  console.log(`mobile screenshot: ${mobileShot}`);

  await browser.close();
  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) found.`);
    process.exit(1);
  }
  console.log('\nAll DevTools checks passed.');
})().catch((err) => {
  console.error('verification crashed:', err.message);
  process.exit(1);
});

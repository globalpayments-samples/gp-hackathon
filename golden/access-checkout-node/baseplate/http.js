'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readRaw(req) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function readJson(req) {
  const raw = await readRaw(req);
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch (error) {
    throw Object.assign(new Error('Request body must be valid JSON'), { status: 400, details: error.message });
  }
}

function respond(res, status, payload) {
  res.statusCode = status;
  if (payload === undefined) return res.end();
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

function servePublic(_req, res, url) {
  const root = path.join(__dirname, '..');
  const rel = url.pathname === '/' ? 'public/index.html' : url.pathname.replace(/^\//, '');
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) return respond(res, 404, { error: { message: 'Route not found' } });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return respond(res, 404, { error: { message: 'Route not found' } });
  const ext = path.extname(file);
  res.setHeader('content-type', ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html');
  res.end(fs.readFileSync(file));
}

module.exports = { readJson, readRaw, respond, servePublic };

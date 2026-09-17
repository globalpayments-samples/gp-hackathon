'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJson(req) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (raw.length === 0) return resolve({});
      try {
        resolve(JSON.parse(raw.toString('utf8')));
      } catch (error) {
        reject(Object.assign(new Error('Request body must be valid JSON'), { status: 400, details: error.message }));
      }
    });
  });
}

function respond(res, status, payload) {
  res.statusCode = status;
  if (payload === undefined) return res.end();
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

function contentType(file) {
  const ext = path.extname(file);
  if (ext === '.css') return 'text/css';
  if (ext === '.js') return 'application/javascript';
  return 'text/html';
}

function safeFile(root, rel) {
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) return null;
  return file;
}

function serveStatic(res, url) {
  const root = path.join(__dirname, '..');
  const rel = url.pathname === '/' ? 'public/index.html' : url.pathname.replace(/^\//, '');
  const file = safeFile(root, rel);
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return respond(res, 404, { error: { message: 'Route not found' } });
  }
  res.setHeader('content-type', contentType(file));
  res.end(fs.readFileSync(file));
}

module.exports = { readJson, respond, serveStatic };

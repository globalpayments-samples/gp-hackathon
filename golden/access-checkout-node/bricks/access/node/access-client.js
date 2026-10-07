'use strict';

const ACCESS_MEDIA_TYPE = 'application/vnd.worldpay.payments-v6+json';
const CHECKOUT_MEDIA_TYPE = 'application/vnd.worldpay.checkout-v2+json';

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${name} is required`), { status: 400 });
  }
  return value.trim();
}

function configuredBaseUrl() {
  const value = process.env.ACCESS_BASE_URL || 'https://try.access.worldpay.com';
  const url = new URL(value);
  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localHttp) {
    throw Object.assign(new Error('ACCESS_BASE_URL must be HTTPS'), { status: 500 });
  }
  return url;
}

function accessHeaders(mediaType) {
  return {
    authorization: 'Basic ' + Buffer.from(`${process.env.ACCESS_MERCHANT_CODE}:${process.env.ACCESS_MERCHANT_KEY}`).toString('base64'),
    accept: mediaType,
    'content-type': mediaType,
    'wp-api-version': '2024-06-01',
  };
}

function trustedHalUrl(href) {
  const base = configuredBaseUrl();
  const target = new URL(requireString(href, 'HAL link'), base);
  const allowedPath = ['/payments', '/checkout-sessions'].some(
    (prefix) => target.pathname === prefix || target.pathname.startsWith(prefix + '/'),
  );
  if (target.origin !== base.origin || target.protocol !== base.protocol || !allowedPath) {
    throw Object.assign(new Error('Refusing HAL link outside configured Access origin/path'), { status: 502 });
  }
  return target;
}

async function accessRequest(url, method, body, mediaType = ACCESS_MEDIA_TYPE) {
  const response = await fetch(url, {
    method,
    headers: accessHeaders(mediaType),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({ message: response.statusText }));
  if (!response.ok) {
    throw Object.assign(new Error(payload.message || 'Access request failed'), { status: response.status, details: payload });
  }
  return payload;
}

module.exports = {
  ACCESS_MEDIA_TYPE,
  CHECKOUT_MEDIA_TYPE,
  accessRequest,
  configuredBaseUrl,
  requireString,
  trustedHalUrl,
};

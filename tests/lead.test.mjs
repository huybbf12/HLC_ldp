import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../api/lead.mjs';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
const originalSecret = process.env.LEAD_WEBHOOK_SECRET;

function validBody(overrides = {}) {
  return {
    name: 'Nguyễn Văn An',
    phone: '0912 345 678',
    service: 'Nội soi dạ dày / đại tràng tiền mê',
    note: 'Cần được tư vấn lịch khám.',
    consent: true,
    website: '',
    formStartedAt: Date.now() - 5_000,
    sourceUrl: 'https://example.com/?utm_source=facebook',
    referrer: 'https://facebook.com/',
    utm: {
      source: 'facebook',
      medium: 'paid-social',
      campaign: 'noi-soi',
    },
    ...overrides,
  };
}

function requestFor(body, headers = {}) {
  return new Request('https://example.com/api/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test.beforeEach(() => {
  process.env.GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
  process.env.LEAD_WEBHOOK_SECRET = 'test-secret';
});

test.after(() => {
  globalThis.fetch = originalFetch;

  if (originalUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
  else process.env.GOOGLE_APPS_SCRIPT_URL = originalUrl;

  if (originalSecret === undefined) delete process.env.LEAD_WEBHOOK_SECRET;
  else process.env.LEAD_WEBHOOK_SECRET = originalSecret;
});

test('health check only exposes configuration status', async () => {
  const response = await GET();
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.configured, true);
  assert.equal(JSON.stringify(result).includes('test-secret'), false);
});

test('valid lead is normalized and forwarded to Apps Script', async () => {
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url: String(url), options, body: JSON.parse(options.body) };
    return Response.json({ ok: true, emailSent: true });
  };

  const response = await POST(requestFor(validBody()));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(forwarded.url, process.env.GOOGLE_APPS_SCRIPT_URL);
  assert.equal(forwarded.body.phone, '0912345678');
  assert.equal(forwarded.body.secret, process.env.LEAD_WEBHOOK_SECRET);
  assert.equal(forwarded.body.utmSource, 'facebook');
  assert.match(forwarded.body.leadId, /^[0-9a-f-]{36}$/);
});

test('invalid Vietnamese phone is rejected', async () => {
  const response = await POST(requestFor(validBody({ phone: '12345' })));
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.ok, false);
  assert.equal(result.field, 'phone');
});

test('consent is required', async () => {
  const response = await POST(requestFor(validBody({ consent: false })));
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.ok, false);
  assert.equal(result.field, 'consent');
});

test('honeypot submission is discarded without calling Apps Script', async () => {
  let fetchWasCalled = false;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    return Response.json({ ok: true });
  };

  const response = await POST(requestFor(validBody({ website: 'spam.example' })));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(fetchWasCalled, false);
});

test('upstream failure returns a retryable user-facing error', async () => {
  globalThis.fetch = async () => {
    throw new Error('network unavailable');
  };

  const response = await POST(requestFor(validBody()));
  const result = await response.json();

  assert.equal(response.status, 502);
  assert.equal(result.ok, false);
  assert.match(result.message, /thử lại|hotline/i);
});

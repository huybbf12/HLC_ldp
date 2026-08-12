import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../api/lead.mjs';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
const originalSecret = process.env.LEAD_WEBHOOK_SECRET;
const originalTurnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
const originalTurnstileSecret = process.env.TURNSTILE_SECRET_KEY;

function validBody(overrides = {}) {
  return {
    name: 'Nguyễn Văn An',
    phone: '0912 345 678',
    service: 'Nội soi dạ dày / đại tràng tiền mê',
    note: 'Cần được tư vấn lịch khám.',
    consent: true,
    website: '',
    formStartedAt: Date.now() - 5_000,
    turnstileToken: '',
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
  delete process.env.TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
});

test.after(() => {
  globalThis.fetch = originalFetch;

  if (originalUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
  else process.env.GOOGLE_APPS_SCRIPT_URL = originalUrl;

  if (originalSecret === undefined) delete process.env.LEAD_WEBHOOK_SECRET;
  else process.env.LEAD_WEBHOOK_SECRET = originalSecret;

  if (originalTurnstileSiteKey === undefined) delete process.env.TURNSTILE_SITE_KEY;
  else process.env.TURNSTILE_SITE_KEY = originalTurnstileSiteKey;

  if (originalTurnstileSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = originalTurnstileSecret;
});

test('health check only exposes configuration status', async () => {
  const response = await GET();
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.configured, true);
  assert.equal(result.turnstileConfigured, false);
  assert.equal(JSON.stringify(result).includes('test-secret'), false);
});

test('valid lead is normalized and forwarded to Apps Script', async () => {
  let forwarded;
  globalThis.fetch = async (url, options) => {
    forwarded = { url: String(url), options, body: JSON.parse(options.body) };
    return Response.json({
      ok: true,
      emailSent: true,
      referenceCode: 'HLC-NS-20260724-001',
    });
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
  assert.equal(result.referenceCode, 'HLC-NS-20260724-001');
  assert.equal(result.message, 'Đăng ký thành công. Hoàng Long Clinic sẽ sớm liên hệ.');
  assert.doesNotMatch(result.message, /HLC-NS-/);
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
  let honeypotLog = '';
  const originalConsoleInfo = console.info;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = message => {
    honeypotLog = String(message);
  };

  try {
    const response = await POST(requestFor(validBody({ website: 'spam.example' }), {
      'User-Agent': 'SpamBot/1.0',
      'x-vercel-ip-country': 'VN',
    }));
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(fetchWasCalled, false);

    const parsedLog = JSON.parse(honeypotLog);
    assert.equal(parsedLog.event, 'hlc_honeypot_filtered');
    assert.equal(parsedLog.reason, 'honeypot');
    assert.equal(parsedLog.country, 'VN');
    assert.equal(parsedLog.userAgent, 'SpamBot/1.0');
    assert.equal(parsedLog.sourceHost, 'example.com');
    assert.equal(parsedLog.utmSource, 'facebook');
    assert.equal(honeypotLog.includes('Nguyễn Văn An'), false);
    assert.equal(honeypotLog.includes('0912 345 678'), false);
    assert.equal(honeypotLog.includes('spam.example'), false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('non-string honeypot value is also discarded without calling Apps Script', async () => {
  let fetchWasCalled = false;
  const originalConsoleInfo = console.info;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = () => {};

  try {
    const response = await POST(requestFor(validBody({ website: { url: 'spam.example' } })));
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(fetchWasCalled, false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('submission under four seconds is discarded without calling upstream services', async () => {
  let fetchWasCalled = false;
  let timingLog = '';
  const originalConsoleInfo = console.info;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = message => {
    timingLog = String(message);
  };

  try {
    const response = await POST(requestFor(validBody({ formStartedAt: Date.now() - 3_000 })));
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(fetchWasCalled, false);

    const parsedLog = JSON.parse(timingLog);
    assert.equal(parsedLog.event, 'hlc_timing_filtered');
    assert.equal(parsedLog.decision, 'blocked');
    assert.equal(parsedLog.reason, 'submitted_too_quickly');
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('missing or invalid form timing is discarded without calling upstream services', async () => {
  let fetchWasCalled = false;
  const originalConsoleInfo = console.info;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = () => {};

  try {
    const response = await POST(requestFor(validBody({ formStartedAt: '' })));
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(fetchWasCalled, false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('cross-origin browser submission is rejected before forwarding', async () => {
  let fetchWasCalled = false;
  const originalConsoleInfo = console.info;
  globalThis.fetch = async () => {
    fetchWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = () => {};

  try {
    const response = await POST(requestFor(validBody(), { Origin: 'https://spam.example' }));
    const result = await response.json();

    assert.equal(response.status, 403);
    assert.equal(result.ok, false);
    assert.equal(fetchWasCalled, false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('Turnstile is verified server-side before a lead is forwarded', async () => {
  process.env.TURNSTILE_SITE_KEY = 'test-site-key';
  process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
  const calls = [];

  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('challenges.cloudflare.com/turnstile')) {
      assert.match(options.body, /secret=test-turnstile-secret/);
      assert.match(options.body, /response=valid-token/);
      return Response.json({ success: true, hostname: 'example.com', action: 'lead_form' });
    }

    return Response.json({
      ok: true,
      emailSent: true,
      referenceCode: 'HLC-NS-20260808-001',
    });
  };

  const response = await POST(requestFor(validBody({ turnstileToken: 'valid-token' }), {
    Origin: 'https://example.com',
  }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
  assert.equal(calls[1].url, process.env.GOOGLE_APPS_SCRIPT_URL);
});

test('fast autofill is accepted when Turnstile has verified the visitor', async () => {
  process.env.TURNSTILE_SITE_KEY = 'test-site-key';
  process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
  const calls = [];
  let timingLog = '';
  const originalConsoleInfo = console.info;

  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('challenges.cloudflare.com/turnstile')) {
      return Response.json({ success: true, hostname: 'example.com', action: 'lead_form' });
    }
    return Response.json({
      ok: true,
      emailSent: true,
      referenceCode: 'HLC-NS-20260812-001',
    });
  };
  console.info = message => {
    timingLog = String(message);
  };

  try {
    const response = await POST(requestFor(validBody({
      formStartedAt: Date.now() - 1_000,
      turnstileToken: 'valid-token',
    }), { Origin: 'https://example.com' }));
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(calls.length, 2);

    const parsedLog = JSON.parse(timingLog);
    assert.equal(parsedLog.event, 'hlc_timing_verified');
    assert.equal(parsedLog.decision, 'allowed');
    assert.equal(parsedLog.verification, 'turnstile_passed');
    assert.equal(timingLog.includes('Nguyễn Văn An'), false);
    assert.equal(timingLog.includes('0912 345 678'), false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('missing timing is accepted when Turnstile has verified the visitor', async () => {
  process.env.TURNSTILE_SITE_KEY = 'test-site-key';
  process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
  let appsScriptWasCalled = false;
  const originalConsoleInfo = console.info;

  globalThis.fetch = async url => {
    if (String(url).includes('challenges.cloudflare.com/turnstile')) {
      return Response.json({ success: true, hostname: 'example.com', action: 'lead_form' });
    }
    appsScriptWasCalled = true;
    return Response.json({ ok: true, referenceCode: 'HLC-NS-20260812-002' });
  };
  console.info = () => {};

  try {
    const response = await POST(requestFor(validBody({
      formStartedAt: '',
      turnstileToken: 'valid-token',
    })));
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(appsScriptWasCalled, true);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('Turnstile result must match both production hostname and action', async () => {
  process.env.TURNSTILE_SITE_KEY = 'test-site-key';
  process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
  let appsScriptWasCalled = false;
  const originalConsoleInfo = console.info;

  globalThis.fetch = async url => {
    if (String(url).includes('challenges.cloudflare.com/turnstile')) {
      return Response.json({ success: true, hostname: 'other.example', action: 'different_form' });
    }
    appsScriptWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = () => {};

  try {
    const response = await POST(requestFor(validBody({ turnstileToken: 'valid-token' })));
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(result.ok, false);
    assert.equal(result.field, 'turnstile');
    assert.equal(appsScriptWasCalled, false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('invalid Turnstile token is rejected without calling Apps Script', async () => {
  process.env.TURNSTILE_SITE_KEY = 'test-site-key';
  process.env.TURNSTILE_SECRET_KEY = 'test-turnstile-secret';
  let appsScriptWasCalled = false;
  const originalConsoleInfo = console.info;

  globalThis.fetch = async url => {
    if (String(url).includes('challenges.cloudflare.com/turnstile')) {
      return Response.json({ success: false, 'error-codes': ['invalid-input-response'] });
    }
    appsScriptWasCalled = true;
    return Response.json({ ok: true });
  };
  console.info = () => {};

  try {
    const response = await POST(requestFor(validBody({ turnstileToken: 'invalid-token' })));
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(result.ok, false);
    assert.equal(result.field, 'turnstile');
    assert.equal(appsScriptWasCalled, false);
  } finally {
    console.info = originalConsoleInfo;
  }
});

test('Apps Script duplicate status is returned so GA4 can ignore repeated leads', async () => {
  globalThis.fetch = async () => Response.json({
    ok: true,
    duplicate: true,
    referenceCode: 'HLC-NS-20260808-001',
  });

  const response = await POST(requestFor(validBody()));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.duplicate, true);
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

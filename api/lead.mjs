const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const MAX_BODY_LENGTH = 20_000;
const MIN_FORM_FILL_TIME_MS = 2_000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ACTION = 'lead_form';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

function cleanText(value, maxLength, preserveLines = false) {
  if (typeof value !== 'string') return '';

  const withoutControls = value
    .replace(preserveLines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '')
    .trim();

  const normalized = preserveLines
    ? withoutControls.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
    : withoutControls.replace(/\s+/g, ' ');

  return normalized.slice(0, maxLength);
}

function normalizeVietnamesePhone(value) {
  let phone = cleanText(value, 30).replace(/[\s().-]/g, '');

  if (phone.startsWith('+84')) phone = `0${phone.slice(3)}`;
  if (phone.startsWith('84') && phone.length === 11) phone = `0${phone.slice(2)}`;

  return phone;
}

function isValidVietnameseMobile(phone) {
  return /^0(?:3|5|7|8|9)\d{8}$/.test(phone);
}

function wasSubmittedTooQuickly(value) {
  const startedAt = Number(value);
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;

  const elapsed = Date.now() - startedAt;
  return elapsed >= 0 && elapsed < MIN_FORM_FILL_TIME_MS;
}

function getRequestHost(request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  if (host) return host.split(',')[0].trim().toLowerCase();

  try {
    return new URL(request.url).host.toLowerCase();
  } catch {
    return '';
  }
}

function hasInvalidOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).host.toLowerCase() !== getRequestHost(request);
  } catch {
    return true;
  }
}

function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim().slice(0, 80);
  return cleanText(request.headers.get('x-real-ip') || '', 80);
}

async function verifyTurnstile(request, token, secret) {
  const formData = new URLSearchParams({
    secret,
    response: token,
  });
  const remoteIp = getClientIp(request);
  if (remoteIp) formData.set('remoteip', remoteIp);

  let response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      signal: AbortSignal.timeout(6_000),
    });
  } catch {
    return { ok: false, unavailable: true };
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return { ok: false, unavailable: true };
  }

  if (!response.ok || result?.success !== true) return { ok: false, unavailable: false };

  const requestHost = getRequestHost(request);
  const verifiedHost = cleanText(result.hostname, 255).toLowerCase();
  if (verifiedHost && requestHost && verifiedHost !== requestHost) {
    return { ok: false, unavailable: false };
  }

  const verifiedAction = cleanText(result.action, 100);
  if (verifiedAction && verifiedAction !== TURNSTILE_ACTION) {
    return { ok: false, unavailable: false };
  }

  return { ok: true, unavailable: false };
}

export async function GET() {
  const turnstileSiteKey = cleanText(process.env.TURNSTILE_SITE_KEY, 500);
  const turnstileSecret = cleanText(process.env.TURNSTILE_SECRET_KEY, 500);
  return json({
    ok: true,
    service: 'Hoang Long lead endpoint',
    configured: Boolean(
      process.env.GOOGLE_APPS_SCRIPT_URL &&
      process.env.LEAD_WEBHOOK_SECRET
    ),
    turnstileConfigured: Boolean(turnstileSiteKey && turnstileSecret),
  });
}

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_LENGTH) {
    return json({ ok: false, message: 'Dữ liệu gửi lên quá lớn.' }, 413);
  }

  if (hasInvalidOrigin(request)) {
    return json({ ok: false, message: 'Yêu cầu không hợp lệ.' }, 403);
  }

  let rawBody;
  let body;
  try {
    rawBody = await request.text();
    if (rawBody.length > MAX_BODY_LENGTH) {
      return json({ ok: false, message: 'Dữ liệu gửi lên quá lớn.' }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  // Trường ẩn và thời gian điền form giúp loại bỏ phần lớn bot đơn giản.
  // Trả về thành công giả để bot không thử lại liên tục.
  if (cleanText(body.website, 200) || wasSubmittedTooQuickly(body.formStartedAt)) {
    return json({ ok: true, message: 'Đã tiếp nhận yêu cầu tư vấn.' });
  }

  const name = cleanText(body.name, 100);
  const phone = normalizeVietnamesePhone(body.phone);
  const service = cleanText(body.service, 120);
  const note = cleanText(body.note, 500, true);
  const consent = body.consent === true || ['true', 'yes', 'on', '1'].includes(String(body.consent).toLowerCase());

  if (name.length < 2) {
    return json({ ok: false, field: 'name', message: 'Vui lòng nhập họ và tên hợp lệ.' }, 400);
  }
  if (!isValidVietnameseMobile(phone)) {
    return json({ ok: false, field: 'phone', message: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ.' }, 400);
  }
  if (!consent) {
    return json({ ok: false, field: 'consent', message: 'Vui lòng đồng ý để phòng khám liên hệ tư vấn.' }, 400);
  }

  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return json({ ok: false, message: 'Hệ thống nhận đăng ký chưa được cấu hình.' }, 503);
  }

  let parsedWebhookUrl;
  try {
    parsedWebhookUrl = new URL(webhookUrl);
  } catch {
    return json({ ok: false, message: 'Hệ thống nhận đăng ký chưa được cấu hình.' }, 503);
  }

  if (
    parsedWebhookUrl.protocol !== 'https:' ||
    parsedWebhookUrl.hostname !== 'script.google.com' ||
    !parsedWebhookUrl.pathname.endsWith('/exec')
  ) {
    return json({ ok: false, message: 'Hệ thống nhận đăng ký chưa được cấu hình.' }, 503);
  }

  const turnstileSiteKey = cleanText(process.env.TURNSTILE_SITE_KEY, 500);
  const turnstileSecret = cleanText(process.env.TURNSTILE_SECRET_KEY, 500);
  const turnstilePartiallyConfigured = Boolean(turnstileSiteKey) !== Boolean(turnstileSecret);
  if (turnstilePartiallyConfigured) {
    return json({
      ok: false,
      field: 'turnstile',
      message: 'Hệ thống chống spam chưa được cấu hình đầy đủ. Vui lòng gọi hotline để được hỗ trợ.',
    }, 503);
  }

  if (turnstileSiteKey && turnstileSecret) {
    const turnstileToken = cleanText(body.turnstileToken, 4_096);
    if (!turnstileToken) {
      return json({
        ok: false,
        field: 'turnstile',
        message: 'Vui lòng hoàn tất bước xác minh chống spam rồi gửi lại.',
      }, 400);
    }

    const verification = await verifyTurnstile(request, turnstileToken, turnstileSecret);
    if (!verification.ok) {
      return json({
        ok: false,
        field: 'turnstile',
        message: verification.unavailable
          ? 'Chưa thể xác minh chống spam lúc này. Vui lòng thử lại hoặc gọi hotline.'
          : 'Xác minh chống spam chưa thành công. Vui lòng thử lại.',
      }, verification.unavailable ? 503 : 400);
    }
  }

  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};
  const lead = {
    leadId: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    name,
    phone,
    service,
    note,
    consent: true,
    sourceUrl: cleanText(body.sourceUrl, 500),
    referrer: cleanText(body.referrer, 500),
    utmSource: cleanText(utm.source, 120),
    utmMedium: cleanText(utm.medium, 120),
    utmCampaign: cleanText(utm.campaign, 160),
    utmContent: cleanText(utm.content, 160),
    utmTerm: cleanText(utm.term, 160),
  };

  let upstream;
  try {
    upstream = await fetch(parsedWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: webhookSecret, ...lead }),
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return json({
      ok: false,
      message: 'Chưa thể gửi đăng ký lúc này. Vui lòng thử lại hoặc gọi hotline.',
    }, 502);
  }

  let result;
  try {
    result = await upstream.json();
  } catch {
    result = null;
  }

  if (!upstream.ok || !result?.ok) {
    return json({
      ok: false,
      message: 'Chưa thể gửi đăng ký lúc này. Vui lòng thử lại hoặc gọi hotline.',
    }, 502);
  }

  const referenceCode = cleanText(result.referenceCode, 80);
  return json({
    ok: true,
    leadId: lead.leadId,
    referenceCode,
    duplicate: result.duplicate === true,
    message: 'Đăng ký thành công. Hoàng Long Clinic sẽ sớm liên hệ.',
  });
}

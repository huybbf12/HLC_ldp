const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const MAX_BODY_LENGTH = 20_000;
const MIN_FORM_FILL_TIME_MS = 4_000;
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

function hasHoneypotValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'string') return true;
  return value.trim().length > 0;
}

function getFormTimingSignal(value) {
  const startedAt = Number(value);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return {
      suspicious: true,
      reason: 'timing_missing_or_invalid',
      elapsedMs: null,
    };
  }

  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return {
      suspicious: true,
      reason: 'timing_invalid',
      elapsedMs: null,
    };
  }

  return {
    suspicious: elapsed < MIN_FORM_FILL_TIME_MS,
    reason: elapsed < MIN_FORM_FILL_TIME_MS ? 'submitted_too_quickly' : 'timing_ok',
    elapsedMs: elapsed,
  };
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

function getUrlHost(value) {
  const url = cleanText(value, 500);
  if (!url) return '';

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getSafeLogContext(request, body) {
  const utm = body.utm && typeof body.utm === 'object' && !Array.isArray(body.utm)
    ? body.utm
    : {};

  return {
    timestamp: new Date().toISOString(),
    country: cleanText(request.headers.get('x-vercel-ip-country') || '', 8),
    region: cleanText(request.headers.get('x-vercel-ip-country-region') || '', 16),
    userAgent: cleanText(request.headers.get('user-agent') || '', 180),
    sourceHost: getUrlHost(body.sourceUrl),
    referrerHost: getUrlHost(body.referrer),
    utmSource: cleanText(utm.source, 120),
    utmMedium: cleanText(utm.medium, 120),
    utmCampaign: cleanText(utm.campaign, 160),
  };
}

function logSecurityDecision(event, request, body, details = {}) {
  // Không ghi tên, số điện thoại, ghi chú, IP, token Turnstile hoặc giá trị honeypot.
  console.info(JSON.stringify({
    event,
    ...details,
    ...getSafeLogContext(request, body),
  }));
}

function logHoneypotBlock(request, body) {
  logSecurityDecision('hlc_honeypot_filtered', request, body, {
    decision: 'blocked',
    reason: 'honeypot',
  });
}

function logTimingDecision(request, body, timing, decision) {
  const elapsedMsBucket = Number.isFinite(timing.elapsedMs)
    ? Math.min(60_000, Math.max(0, Math.round(timing.elapsedMs / 250) * 250))
    : null;

  logSecurityDecision(
    decision === 'blocked' ? 'hlc_timing_filtered' : 'hlc_timing_verified',
    request,
    body,
    {
      decision,
      reason: timing.reason,
      elapsedMsBucket,
      verification: decision === 'allowed' ? 'turnstile_passed' : 'turnstile_unavailable',
    }
  );
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
    return { ok: false, unavailable: true, reason: 'siteverify_unavailable', errorCodes: [] };
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return { ok: false, unavailable: true, reason: 'siteverify_invalid_response', errorCodes: [] };
  }

  const errorCodes = Array.isArray(result?.['error-codes'])
    ? result['error-codes'].map(code => cleanText(code, 80)).filter(Boolean).slice(0, 6)
    : [];

  if (!response.ok || result?.success !== true) {
    return { ok: false, unavailable: false, reason: 'siteverify_rejected', errorCodes };
  }

  const requestHost = getRequestHost(request);
  const verifiedHost = cleanText(result.hostname, 255).toLowerCase();
  if (!verifiedHost || !requestHost || verifiedHost !== requestHost) {
    return { ok: false, unavailable: false, reason: 'hostname_mismatch', errorCodes: [] };
  }

  const verifiedAction = cleanText(result.action, 100);
  if (verifiedAction !== TURNSTILE_ACTION) {
    return { ok: false, unavailable: false, reason: 'action_mismatch', errorCodes: [] };
  }

  return { ok: true, unavailable: false, reason: 'verified', errorCodes: [] };
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
    logSecurityDecision('hlc_origin_rejected', request, {}, {
      decision: 'blocked',
      reason: 'cross_origin',
      originHost: getUrlHost(request.headers.get('origin') || ''),
    });
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

  // Trả về thành công giả để bot không thử lại liên tục. Chỉ honeypot được ghi
  // thành một luồng đo riêng; không gửi GA4, email hoặc dữ liệu sang Sheet.
  if (hasHoneypotValue(body.website)) {
    logHoneypotBlock(request, body);
    return json({ ok: true, message: 'Đã tiếp nhận yêu cầu tư vấn.' });
  }

  // Thời gian điền form là tín hiệu mềm. Nếu Turnstile xác minh được người dùng,
  // submission nhanh do autofill vẫn được nhận thay vì bị mất lead âm thầm.
  const formTiming = getFormTimingSignal(body.formStartedAt);

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
  let turnstilePassed = false;
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
      logSecurityDecision('hlc_turnstile_rejected', request, body, {
        decision: 'blocked',
        reason: 'missing_token',
        errorCodes: [],
      });
      return json({
        ok: false,
        field: 'turnstile',
        message: 'Vui lòng hoàn tất bước xác minh chống spam rồi gửi lại.',
      }, 400);
    }

    const verification = await verifyTurnstile(request, turnstileToken, turnstileSecret);
    if (!verification.ok) {
      logSecurityDecision('hlc_turnstile_rejected', request, body, {
        decision: 'blocked',
        reason: verification.reason,
        errorCodes: verification.errorCodes,
      });
      return json({
        ok: false,
        field: 'turnstile',
        message: verification.unavailable
          ? 'Chưa thể xác minh chống spam lúc này. Vui lòng thử lại hoặc gọi hotline.'
          : 'Xác minh chống spam chưa thành công. Vui lòng thử lại.',
      }, verification.unavailable ? 503 : 400);
    }

    turnstilePassed = true;
  }

  if (formTiming.suspicious) {
    if (turnstilePassed) {
      logTimingDecision(request, body, formTiming, 'allowed');
    } else {
      logTimingDecision(request, body, formTiming, 'blocked');
      return json({ ok: true, message: 'Đã tiếp nhận yêu cầu tư vấn.' });
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

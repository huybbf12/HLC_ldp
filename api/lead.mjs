const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const MAX_BODY_LENGTH = 20_000;

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
  return elapsed >= 0 && elapsed < 750;
}

export async function GET() {
  return json({
    ok: true,
    service: 'Hoang Long lead endpoint',
    configured: Boolean(
      process.env.GOOGLE_APPS_SCRIPT_URL &&
      process.env.LEAD_WEBHOOK_SECRET
    ),
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
    message: referenceCode
      ? `Đăng ký thành công. Mã tham chiếu của bạn là ${referenceCode}. Hoàng Long Clinic sẽ sớm liên hệ.`
      : 'Đăng ký thành công. Hoàng Long Clinic sẽ sớm liên hệ với bạn.',
  });
}

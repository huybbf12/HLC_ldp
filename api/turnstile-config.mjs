const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export async function GET() {
  const siteKey = String(process.env.TURNSTILE_SITE_KEY || '').trim();
  const secretConfigured = Boolean(String(process.env.TURNSTILE_SECRET_KEY || '').trim());

  return new Response(JSON.stringify({
    ok: true,
    enabled: Boolean(siteKey && secretConfigured),
    siteKey: siteKey && secretConfigured ? siteKey : '',
  }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

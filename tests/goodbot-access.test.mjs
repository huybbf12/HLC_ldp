import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const robots = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const leadApi = readFileSync(new URL('../api/lead.mjs', import.meta.url), 'utf8');

test('public landing page explicitly allows legitimate crawlers', () => {
  assert.match(html, /<meta name="robots" content="index, follow,[^"]+">/);
  assert.doesNotMatch(html, /noindex|nofollow/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/noisoihoanglong\.net\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/noisoihoanglong\.net\/">/);

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Disallow: \/api\/$/m);
  assert.match(robots, /^Sitemap: https:\/\/noisoihoanglong\.net\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
});

test('sitemap exposes the canonical public page only', () => {
  assert.match(sitemap, /<loc>https:\/\/noisoihoanglong\.net\/<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 1);
});

test('legacy and www hosts permanently redirect to the canonical domain', () => {
  const redirects = vercelConfig.redirects || [];
  const expectedHosts = [
    'noisoihoanglong.vercel.app',
    'www.noisoihoanglong.net',
  ];

  for (const host of expectedHosts) {
    const rule = redirects.find(candidate =>
      candidate.source === '/:path*' &&
      candidate.has?.some(condition => condition.type === 'host' && condition.value === host)
    );
    assert.ok(rule, `missing canonical redirect for ${host}`);
    assert.equal(rule.destination, 'https://noisoihoanglong.net/:path*');
    assert.equal(rule.permanent, true);
  }
});

test('API is kept out of search results without blocking the public page', () => {
  const apiRule = vercelConfig.headers.find(rule => rule.source === '/api/(.*)');
  assert.ok(apiRule);
  assert.ok(apiRule.headers.some(header =>
    header.key === 'X-Robots-Tag' && /noindex/.test(header.value)
  ));

  const rootRule = vercelConfig.headers.find(rule => rule.source === '/(.*)');
  assert.ok(rootRule);
  assert.equal(rootRule.headers.some(header => header.key === 'X-Robots-Tag'), false);
});

test('lead protection never grants or denies access from a bot-name user agent', () => {
  assert.doesNotMatch(leadApi, /user-?agent[^\n]{0,120}(includes|match|test)\s*\([^\n]*(bot|crawler|spider)/i);
  assert.doesNotMatch(JSON.stringify(vercelConfig), /googlebot|bingbot|adsbot|crawler|spider|headless/i);
});

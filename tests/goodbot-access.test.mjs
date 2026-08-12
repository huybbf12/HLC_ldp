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
  assert.match(html, /<link rel="canonical" href="https:\/\/noisoihoanglong\.vercel\.app\/">/);

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Disallow: \/api\/$/m);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
});

test('sitemap exposes the canonical public page only', () => {
  assert.match(sitemap, /<loc>https:\/\/noisoihoanglong\.vercel\.app\/<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 1);
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'assets/css/landing-page.css'), 'utf8');

const criticalFonts = [
  'assets/fonts/nunito-vietnamese-variable.woff2',
  'assets/fonts/nunito-latin-variable.woff2',
  'assets/fonts/be-vietnam-pro-900.woff2',
  'assets/fonts/be-vietnam-pro-latin-900.woff2',
  'assets/fonts/be-vietnam-pro-800.woff2',
  'assets/fonts/be-vietnam-pro-latin-800.woff2',
];

test('critical fonts are preloaded before the render-blocking stylesheet', async () => {
  const stylesheetIndex = html.indexOf('rel="stylesheet"');
  assert.ok(stylesheetIndex > 0);

  for (const fontPath of criticalFonts) {
    const preload = `<link rel="preload" href="${fontPath}" as="font" type="font/woff2" crossorigin="anonymous">`;
    const preloadIndex = html.indexOf(preload);
    assert.ok(preloadIndex >= 0, `missing preload for ${fontPath}`);
    assert.ok(preloadIndex < stylesheetIndex, `${fontPath} must be discovered before the stylesheet`);
    await access(path.join(root, fontPath));
  }
});

test('all font faces remain available after the preload window', () => {
  assert.equal((css.match(/font-display:\s*swap;/g) ?? []).length, 10);
  assert.doesNotMatch(css, /font-display:\s*optional;/);
});

test('font delivery remains self-hosted and versioned for V73', () => {
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /landing-page\.css\?v=73-mri-ct-labels/);
});

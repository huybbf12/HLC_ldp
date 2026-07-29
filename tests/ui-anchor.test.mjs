import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('all appointment and consultation CTAs target the registration card', () => {
  const registrationLinks = html.match(/href="#registration-form"/g) ?? [];

  assert.equal(registrationLinks.length, 10);
  assert.doesNotMatch(html, /href="#review-registration"/);
});

test('registration anchor is unique, contains the lead form and clears the fixed navbar', () => {
  const registrationTargets = html.match(/id="registration-form"/g) ?? [];
  const targetPosition = html.indexOf('id="registration-form"');
  const formPosition = html.indexOf('id="lead-form"');

  assert.equal(registrationTargets.length, 1);
  assert.ok(targetPosition > -1);
  assert.ok(formPosition > targetPosition);
  assert.match(html, /#registration-form\s*\{[^}]*scroll-margin-top:\s*96px;/s);
  assert.match(html, /@media \(max-width:\s*767px\)\s*\{[\s\S]*?#registration-form\s*\{[^}]*scroll-margin-top:\s*76px;/);
});

test('mobile hero keeps “sớm tích hợp AI” together', () => {
  assert.match(
    html,
    /Tầm soát <span class="hero-mobile-cluster">sớm <span class="hero-ai-break">tích hợp AI<\/span><\/span>/,
  );
  assert.match(html, /\.hero-mobile-cluster\s*\{[^}]*display:\s*inline-block;[^}]*white-space:\s*nowrap;/s);
  assert.match(html, /\.hero-mobile-cluster \.hero-ai-break\s*\{[^}]*display:\s*inline;/s);
});

test('MRI gallery crops images cleanly and uses the updated doctor portrait', () => {
  assert.match(html, /\.mri-gallery-item\s*\{[^}]*background:\s*#0b3044;/s);
  assert.match(
    html,
    /\.mri-gallery-item--equipment img\s*\{[^}]*padding:\s*0\s*!important;[^}]*object-fit:\s*cover;[^}]*transform:\s*scale\(1\.08\)\s*!important;/s,
  );
  assert.match(html, /src="assets\/images\/doctors\/nghiem-dinh-phan\.webp"/);
  assert.doesNotMatch(html, /Ảnh tạm thời: dùng ảnh BS\. Hải/);
});

test('doctor section contains six cards with lightweight carousel controls', () => {
  const doctorCards = html.match(/class="doctor-card /g) ?? [];
  const carouselButtons = html.match(/class="doctor-carousel__nav doctor-carousel__nav--(?:prev|next)"/g) ?? [];

  assert.equal(doctorCards.length, 6);
  assert.equal(carouselButtons.length, 2);
  assert.match(html, /data-doctor-carousel/);
  assert.match(html, /src="assets\/images\/doctors\/dinh-duy-hai\.webp"/);
  assert.match(html, /src="assets\/images\/doctors\/bs-chi\.webp"/);
  assert.match(html, /moveDoctorCarousel/);
  assert.match(html, /Với gần 50 năm kinh nghiệm trong nghiên cứu các phương pháp điều trị bệnh lý tiêu hóa - gan mật\./);
});

test('updated Series 700 Zoom benefit copy is present', () => {
  assert.match(html, /Tăng khả năng phát hiện sớm các dấu hiệu ung thư tiêu hóa/);
  assert.doesNotMatch(html, /Tăng khả năng phát hiện nguy cơ ung thư tiêu hóa từ sớm/);
});

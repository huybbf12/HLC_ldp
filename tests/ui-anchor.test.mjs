import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('all appointment and consultation CTAs target the registration card', () => {
  const registrationLinks = html.match(/href="#registration-form"/g) ?? [];

  assert.equal(registrationLinks.length, 14);
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

test('doctor section contains ten cards, four-up desktop layout and lightweight carousel controls', () => {
  const doctorCards = html.match(/class="doctor-card /g) ?? [];
  const carouselButtons = html.match(/class="doctor-carousel__nav doctor-carousel__nav--(?:prev|next)"/g) ?? [];
  const doctorScriptStart = html.indexOf('// Carousel chuyên gia');
  const doctorScriptEnd = html.indexOf('// Trên thiết bị cảm ứng', doctorScriptStart);
  const doctorScript = html.slice(doctorScriptStart, doctorScriptEnd);

  assert.equal(doctorCards.length, 10);
  assert.equal(carouselButtons.length, 2);
  assert.match(html, /data-doctor-carousel/);
  assert.match(html, /flex:\s*0 0 calc\(\(100% - 60px\) \/ 4\)/);
  assert.match(html, /src="assets\/images\/doctors\/duong-thi-phuong-nang\.webp"/);
  assert.match(html, /src="assets\/images\/doctors\/nguyen-thanh-tung\.webp"/);
  assert.doesNotMatch(html, /ĐINH DUY HẢI|BÁC SĨ CHI/);
  assert.match(html, /moveDoctorCarousel/);
  assert.match(html, /Với gần 50 năm kinh nghiệm trong nghiên cứu các phương pháp điều trị bệnh lý tiêu hóa - gan mật\./);
  assert.match(html, /Phó Chủ tịch · Hội Khoa học Tiêu hóa Việt Nam/);
  assert.equal(
    (html.match(/Giám đốc chuyên môn - Phòng khám Đa Khoa Hoàng Long/g) ?? []).length,
    2,
  );
  assert.match(html, /Chuyên khoa Chẩn đoán hình ảnh/);
  assert.match(html, /\.doctor-position\s*\{[^}]*min-height:\s*52px;[^}]*max-height:\s*52px;/s);
  assert.match(html, /\.doctor-position > span\s*\{[^}]*-webkit-line-clamp:\s*2;/s);
  assert.doesNotMatch(html, /doctor-position__icon/);
  assert.match(html, /#chuyen-gia \.doctor-carousel__track\s*\{[^}]*overflow-x:\s*hidden;[^}]*touch-action:\s*pan-y;/s);
  assert.doesNotMatch(doctorScript, /setInterval|setTimeout|autoplay|keydown/);
});

test('13+ and 100+ trust metrics count up from zero', () => {
  assert.match(html, /class="counter" data-target="13" data-duration="1500">0<\/span>\+/);
  assert.match(html, /class="counter" data-target="100" data-duration="2500">0<\/span>\+/);
  assert.doesNotMatch(html, /data-target="110"/);
});

test('footer uses the refreshed wide logo asset', () => {
  assert.match(
    html,
    /src="assets\/images\/brand\/logo-footer-hoang-long\.png"[^>]*width="1800" height="220"/,
  );
});

test('updated Series 700 Zoom benefit copy is present', () => {
  assert.match(html, /Tăng khả năng phát hiện sớm các dấu hiệu ung thư tiêu hóa/);
  assert.doesNotMatch(html, /Tăng khả năng phát hiện nguy cơ ung thư tiêu hóa từ sớm/);
});

test('FAQ follows a coherent endoscopy-to-aftercare-to-condition sequence', () => {
  const faqStart = html.indexOf('<section id="faq"');
  const faqEnd = html.indexOf('<!-- FOOTER -->', faqStart);
  const faq = html.slice(faqStart, faqEnd);
  const expectedQuestions = [
    '1. Nội soi dạ dày phát hiện những bệnh gì?',
    '2. Nội soi dạ dày mất bao lâu?',
    '3. Bao lâu nên nội soi dạ dày một lần?',
    '4. Triệu chứng sau khi nội soi dạ dày là gì?',
    '5. Sau khi cắt polyp dạ dày nên ăn gì?',
    '6. Thăm dò chức năng là gì?',
    '7. Triệu chứng đau thượng vị dạ dày là gì?',
    '8. Trào ngược dạ dày thực quản là gì?',
    '9. Trào ngược dạ dày thực quản nên ăn gì?',
    '10. Dấu hiệu bệnh trĩ là gì?',
    '11. Bệnh trĩ nội có nguy hiểm không?',
    '12. Bị trĩ nên ăn gì?',
  ];
  let previousPosition = -1;

  for (const question of expectedQuestions) {
    const position = faq.indexOf(question);
    assert.ok(position > previousPosition, `${question} phải nằm đúng thứ tự`);
    previousPosition = position;
  }

  assert.equal((faq.match(/class="faq-group-label"/g) ?? []).length, 3);
  assert.match(faq, /Nội soi dạ dày & chăm sóc sau can thiệp/);
  assert.match(faq, /Thăm dò & bệnh lý dạ dày – thực quản/);
  assert.match(faq, /Bệnh lý hậu môn – trực tràng/);
});

test('FAQ uses the refreshed medical copy supplied for this version', () => {
  const faqStart = html.indexOf('<section id="faq"');
  const faqEnd = html.indexOf('<!-- FOOTER -->', faqStart);
  const faq = html.slice(faqStart, faqEnd);

  assert.match(faq, /toàn bộ buổi thăm khám dao động trong khoảng 30 – 45 phút/);
  assert.match(faq, /<strong>3 - 5 năm\/lần:<\/strong>/);
  assert.match(faq, /<strong>6 tháng - 1 năm\/lần:<\/strong>/);
  assert.match(faq, /Mỗi đợt đau kéo dài 15–20 phút/);
  assert.match(faq, /dịch dạ dày \(chứa axit và enzym tiêu hóa\)/);
  assert.match(faq, /<strong>Sa nghẹt, tắc mạch:<\/strong>/);
  assert.match(faq, /táo, dưa hấu, chuối, bơ, đu đủ, thanh long/);
  assert.doesNotMatch(faq, /là là các kỹ thuật/);
  assert.doesNotMatch(faq, /làm sạch ruột đến khi kết thúc nội soi/);
});

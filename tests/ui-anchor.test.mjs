import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('page uses the Hoàng Long favicon for browser tabs and saved-page icons', async () => {
  assert.match(html, /<link rel="icon" type="image\/png" href="favicon\.png">/);
  assert.match(html, /<link rel="apple-touch-icon" href="favicon\.png">/);

  const favicon = await stat(new URL('../favicon.png', import.meta.url));
  assert.ok(favicon.size > 0);
});

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
    /\.mri-gallery-item--equipment img\s*\{[^}]*padding:\s*0\s*!important;[^}]*object-fit:\s*cover;[^}]*transform:\s*scale\(1\.015\)\s*!important;/s,
  );
  assert.match(html, /src="assets\/images\/clinic\/mri-system\.webp"/);
  assert.match(html, /src="assets\/images\/clinic\/ct-system\.webp"/);
  assert.doesNotMatch(html, /hoanglongclinic\.vn\/Uploads\/(?:8-copy|7-chay-like)/);
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
  assert.match(html, /Với gần 50 năm kinh nghiệm trong lĩnh vực Ngoại tiêu hóa\./);
  assert.match(html, /Phó Chủ tịch · Hội Khoa học Tiêu hóa Việt Nam/);
  assert.match(html, /Giám đốc chuyên môn - Phòng khám Đa khoa Hoàng Long CS1/);
  assert.match(html, /Giám đốc chuyên môn - Phòng khám Đa khoa Hoàng Long CS2/);
  assert.match(html, /Nguyên Giám đốc Bệnh viện Đại học Y Hà Nội/);
  assert.match(html, /Chủ nhiệm Bộ môn Ngoại Khoa Dã Chiến Học Viện Quân y/);
  assert.match(html, /Nguyên Giám đốc Bệnh viện Thanh Nhàn/);
  assert.match(html, /Nguyên Giám đốc Trung tâm ứng dụng công nghệ y học – Nội soi tiêu hóa/);
  assert.match(html, /<span class="doctor-title-badge">ThS\. BSCKI\.<\/span>[\s\S]*?NGUYỄN VÂN ANH/);
  assert.match(html, /Chuyên khoa Chẩn đoán hình ảnh/);
  assert.match(html, /\.doctor-position\s*\{[^}]*min-height:\s*52px;[^}]*max-height:\s*52px;/s);
  assert.match(html, /\.doctor-position > span\s*\{[^}]*-webkit-line-clamp:\s*2;/s);
  assert.doesNotMatch(html, /doctor-position__icon/);
  assert.match(html, /#chuyen-gia \.doctor-carousel__track\s*\{[^}]*overflow-x:\s*hidden;[^}]*touch-action:\s*pan-y;/s);
  assert.doesNotMatch(doctorScript, /setInterval|setTimeout|autoplay|keydown/);
});

test('all ten doctor cards use the latest vertical portraits and supplied experience copy', () => {
  const expectedImages = [
    'dao-van-long.webp',
    'nguyen-duy-thang.webp',
    'nghiem-dinh-phan.webp',
    'nguyen-ba-kinh.webp',
    'pham-thi-lan-huong.webp',
    'duong-thi-phuong-nang.webp',
    'nguyen-van-anh.webp',
    'nguyen-thi-phip.webp',
    'nguyen-thanh-tung.webp',
    'nguyen-viet-nam.webp',
  ];

  expectedImages.forEach(image => {
    assert.match(html, new RegExp(`src="assets/images/doctors/${image.replace('.', '\\.')}"`));
  });
  assert.doesNotMatch(html, /data-photo-temporary="bs-hai"/);
  assert.match(html, /alt="BSCKII\. Nguyễn Bá Kinh"/);
  assert.match(html, /Hơn 6 năm công tác tại Phòng khám Đa khoa Hoàng Long\./);
  assert.match(html, /Hơn 5 năm công tác tại Phòng khám Đa khoa Hoàng Long\./);
  assert.match(html, /Hơn 10 năm công tác tại Phòng khám Đa khoa Hoàng Long\./);
  assert.equal((html.match(/Hơn 4 năm công tác tại Phòng khám Đa khoa Hoàng Long\./g) ?? []).length, 2);
  assert.doesNotMatch(html, /Thầy thuốc ưu tú/);
});

test('doctor cards follow the approved expert order', () => {
  const trackStart = html.indexOf('id="doctorCarouselTrack"');
  const trackEnd = html.indexOf('doctor-carousel__nav doctor-carousel__nav--next', trackStart);
  const track = html.slice(trackStart, trackEnd);
  const expectedNames = [
    'ĐÀO VĂN LONG',
    'NGUYỄN DUY THẮNG',
    'NGHIÊM ĐÌNH PHÀN',
    'NGUYỄN BÁ KINH',
    'PHẠM THỊ LAN HƯƠNG',
    'DƯƠNG THỊ PHƯƠNG NĂNG',
    'NGUYỄN VÂN ANH',
    'NGUYỄN THỊ PHÍP',
    'NGUYỄN THANH TÙNG',
    'NGUYỄN VIẾT NAM',
  ];
  let previousPosition = -1;

  for (const name of expectedNames) {
    const position = track.indexOf(name);
    assert.ok(position > previousPosition, `${name} phải nằm đúng thứ tự`);
    previousPosition = position;
  }
});

test('first five doctor cards use expert CTA and remaining cards use doctor CTA', () => {
  const trackStart = html.indexOf('id="doctorCarouselTrack"');
  const trackEnd = html.indexOf('doctor-carousel__nav doctor-carousel__nav--next', trackStart);
  const track = html.slice(trackStart, trackEnd);
  const cards = track.match(/<!-- Bác sĩ \d+ -->[\s\S]*?(?=<!-- Bác sĩ \d+ -->|$)/g) ?? [];

  assert.equal(cards.length, 10);
  cards.slice(0, 5).forEach(card => assert.match(card, />Đặt lịch với chuyên gia<\/a>/));
  cards.slice(5).forEach(card => assert.match(card, />Đặt lịch với bác sĩ<\/a>/));
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

test('footer customer-support links point to the supplied Hoàng Long pages', () => {
  assert.match(html, /href="https:\/\/hoanglongclinic\.vn\/vi\/huong-dan-khach-hang\/chinh-sach-phong-kham\/huong-dan-dat-lich-kham-online-qua-website\.100474\.htm"[^>]*>[\s\S]*?Hướng dẫn đặt lịch<\/a>/);
  assert.match(html, /href="https:\/\/hoanglongclinic\.vn\/vi\/huong-dan-khach-hang\/huong-dan-benh-nhan"[^>]*>[\s\S]*?Quy trình khám bệnh<\/a>/);
  assert.match(html, /href="https:\/\/hoanglongclinic\.vn\/vi\/huong-dan-khach-hang\/hoi-dap-cung-giao-su"[^>]*>[\s\S]*?Hỏi - đáp cùng giáo sư<\/a>/);
  assert.doesNotMatch(html, /> Chính sách bảo hiểm<\/a>/);
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
    '2. Nội soi có đau không?',
    '3. Nội soi tiền mê là gì?',
    '4. Nội soi dạ dày mất bao lâu?',
    '5. Bao lâu nên nội soi dạ dày một lần?',
    '6. Triệu chứng sau khi nội soi dạ dày là gì?',
    '7. Sau khi cắt polyp dạ dày nên ăn gì?',
    '8. Thăm dò chức năng là gì?',
    '9. Triệu chứng đau thượng vị dạ dày là gì?',
    '10. Trào ngược dạ dày thực quản là gì?',
    '11. Trào ngược dạ dày thực quản nên ăn gì?',
    '12. Dấu hiệu bệnh trĩ là gì?',
    '13. Bệnh trĩ nội có nguy hiểm không?',
    '14. Bị trĩ nên ăn gì?',
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
  assert.match(faq, /Nội soi dạ dày thường không gây đau rõ rệt/);
  assert.match(faq, /nội soi đại tràng có thể gây tức hoặc quặn bụng nhẹ/);
  assert.match(faq, /thuốc an thần hoặc thuốc mê tác dụng ngắn qua đường tĩnh mạch/);
  assert.match(faq, /loại bỏ hoàn toàn cảm giác đau hay lo lắng/);
  assert.match(faq, /bác sĩ và điều dưỡng sẽ theo dõi liên tục các chỉ số mạch, huyết áp, nhịp thở, nồng độ oxy máu/);
  assert.match(faq, /tuyệt đối không tự lái xe trong ngày/);
  assert.doesNotMatch(faq, /là là các kỹ thuật/);
  assert.doesNotMatch(faq, /làm sạch ruột đến khi kết thúc nội soi/);
});

test('customer reviews use the supplied live labels and Google profile avatars', () => {
  const reviewStart = html.indexOf('class="review-list');
  const reviewEnd = html.indexOf('<!-- BÊN PHẢI: FORM ĐĂNG KÝ -->', reviewStart);
  const reviews = html.slice(reviewStart, reviewEnd);
  const expected = [
    ['Hoài Thị Võ Thương', '2 tháng trước', 'ALV-UjWYYoKa88DgwFRY5QbhmhIQlHda-SfEKWwFdfg3BCgW97UaAjg'],
    ['Quyết Nguyễn', '5 tháng trước', 'ACg8ocJq0lxgSfigm9Lb6d5BQiEDZHCJ36wihcaqbYjJ-HRUdLnapNg'],
    ['Hằng Lê', '4 tháng trước', 'ACg8ocJ9gqL3c5Z-E695xJB6FIZTpU30euNyCUdouZGLZLOtJqUcJw'],
    ['Trọng Phạm', '5 tháng trước', 'ALV-UjWPRawLY1cQl6AuFKAUwOJHnQwLrlJjsAtwFwzqD0oJ0uS80Aw'],
    ['Hiếu Trần', '4 tháng trước', 'ALV-UjX3Hbrt56XCO_GvBuVlwZDcZHSu63HziWcaNww63zZKtHpA0I-k'],
    ['Bàng Thị Thảo', '6 tháng trước', 'ACg8ocLRo1J78OgWi9D7u2dXUzyR0M4UGVhB7bAdB68YyaT7oT7mbQ'],
    ['Linh Tran', '4 tháng trước', 'ACg8ocJCwIaqRaWwc0kSrnxMn_fPs1MF1Npx_Asho3koP-YFez4AoA'],
    ['Huệ Phạm', '7 tháng trước', 'ACg8ocKcxg8JeM2rZz6cG7NAZ31fWx5AjKt7u4odIA08GDeZDImvkQ'],
    ['Nhỏ Xíu', '2 tháng trước', 'ALV-UjWR1EDoI8n0XGw6MVISWvjVpF3zVtyIZKjDDO1YsZ_P0bbJoKNo'],
    ['Anh Nguyen', '4 tháng trước', 'ACg8ocJvSP_Z0u71mPi62IOT5Rz7Pbfq9e7w79B3-i54nyqu1v82eA'],
    ['Thuy Tran', '4 tháng trước', 'ALV-UjUzRu4UvM91qYr8xs4-Zz6O73fgT6L5_FfuSmVS8ZnXAWKAXUg2'],
  ];

  assert.equal((reviews.match(/class="review-avatar"/g) ?? []).length, 11);
  for (const [name, time, avatarId] of expected) {
    assert.match(reviews, new RegExp(name));
    assert.match(reviews, new RegExp(time));
    assert.match(reviews, new RegExp(avatarId));
  }
});

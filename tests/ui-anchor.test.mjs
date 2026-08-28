import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const documentHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const stylesheet = await readFile(new URL('../assets/css/landing-page.css', import.meta.url), 'utf8');
const html = `${documentHtml}\n${stylesheet}`;
const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

test('Vercel serves the static landing page from the project root', () => {
  assert.equal(vercelConfig.outputDirectory, '.');
});

test('GTM is installed once while direct Google Ads and GA4 tracking remains active', () => {
  assert.equal((documentHtml.match(/GTM-WKCCTNBR/g) ?? []).length, 2);
  assert.equal((documentHtml.match(/googletagmanager\.com\/gtm\.js\?id=/g) ?? []).length, 1);
  assert.equal((documentHtml.match(/googletagmanager\.com\/ns\.html\?id=GTM-WKCCTNBR/g) ?? []).length, 1);
  assert.match(documentHtml, /\}\)\(window,document,'script','dataLayer','GTM-WKCCTNBR'\);<\/script>/);
  assert.match(documentHtml, /<body>\s*<!-- Google Tag Manager \(noscript\) -->\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-WKCCTNBR"/);
  assert.equal((html.match(/googletagmanager\.com\/gtag\/js\?id=AW-16914582158/g) ?? []).length, 1);
  assert.equal((html.match(/googletagmanager\.com\/gtag\/js\?id=/g) ?? []).length, 1);
  assert.equal((html.match(/gtag\('config', 'AW-16914582158'\)/g) ?? []).length, 1);
  assert.equal((html.match(/gtag\('config', 'G-GLBFPTHWG6'\)/g) ?? []).length, 1);
  assert.doesNotMatch(documentHtml, /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js/);
  assert.match(documentHtml, /script\.src = 'https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=AW-16914582158';/);
  assert.match(documentHtml, /const interactionEvents = \['pointerdown', 'touchstart', 'keydown', 'scroll'\];/);
  assert.match(documentHtml, /fallbackTimer = window\.setTimeout\(loadGoogleTag, 8000\);/);
});

test('large styles are cached separately and first-paint fonts avoid late swaps', () => {
  assert.match(documentHtml, /<link rel="stylesheet" href="assets\/css\/landing-page\.css\?v=70-diagnostic-showcase-refined">/);
  assert.ok(
    documentHtml.indexOf('href="assets/css/landing-page.css?v=70-diagnostic-showcase-refined"')
      < documentHtml.indexOf('(function scheduleGoogleTag()'),
  );
  assert.doesNotMatch(documentHtml, /<style(?:\s|>)/);
  assert.ok(stylesheet.length > 100_000);
  assert.match(stylesheet, /font-display: swap;/);
  assert.doesNotMatch(stylesheet, /font-display: optional;/);
  assert.match(stylesheet, /url\('\.\.\/fonts\/be-vietnam-pro-900\.woff2'\)/);
  assert.match(stylesheet, /url\('\.\.\/fonts\/nunito-vietnamese-variable\.woff2'\)/);
  assert.doesNotMatch(stylesheet, /url\('assets\/fonts\//);
});

test('GA4 tracks CTA actions and successful leads without sending form values', () => {
  assert.match(html, /const GA4_MEASUREMENT_ID = 'G-GLBFPTHWG6';/);
  assert.match(
    html,
    /const GA4_DEBUG_MODE = new URLSearchParams\(window\.location\.search\)\.get\('ga_debug'\) === '1';/,
  );
  assert.match(
    html,
    /const analyticsPayload = \{\s*send_to: GA4_MEASUREMENT_ID,[\s\S]*?window\.gtag\('event', eventName, analyticsPayload\);/,
  );
  assert.match(html, /if \(GA4_DEBUG_MODE\) \{\s*analyticsPayload\.debug_mode = true;/s);

  [
    'cta_click',
    'click_to_call',
    'zalo_click',
    'directions_click',
    'lead_form_start',
    'lead_submit_attempt',
    'lead_form_error',
    'generate_lead',
  ].forEach(eventName => {
    assert.match(html, new RegExp(`trackGa4Event\\('${eventName}'`));
  });

  const successCheck = html.indexOf('if (!response.ok || !result.ok)');
  const leadEvent = html.indexOf("trackGa4Event('generate_lead'", successCheck);
  const formReset = html.indexOf('leadForm.reset()', successCheck);
  const validityCheck = html.indexOf('if (!leadForm.reportValidity())');
  const submitAttempt = html.indexOf("trackGa4Event('lead_submit_attempt'", validityCheck);
  const leadRequest = html.indexOf("fetch('/api/lead'", submitAttempt);
  const analyticsBlockStart = html.indexOf('const trackGa4Event');
  const analyticsBlockEnd = html.indexOf('const scrollProgress', analyticsBlockStart);
  const analyticsBlock = html.slice(analyticsBlockStart, analyticsBlockEnd);

  assert.ok(successCheck > -1 && leadEvent > successCheck && formReset > leadEvent);
  assert.ok(validityCheck > -1 && submitAttempt > validityCheck && leadRequest > submitAttempt);
  assert.match(html, /leadForm\.addEventListener\('invalid',[\s\S]*?error_type: 'validation'[\s\S]*?}, true\);/);
  assert.doesNotMatch(analyticsBlock, /formData|get\('name'\)|get\('phone'\)|get\('service'\)|get\('note'\)/);
  assert.doesNotMatch(html, /trackGa4Event\([^)]*(?:referenceCode|leadId|phone|service|note)/s);
  assert.match(html, /if \(result\.leadId && !result\.duplicate\) \{\s*trackGa4Event\('generate_lead'/s);
});

test('Turnstile is lazy-loaded near the form and never blocks the initial render', () => {
  assert.match(documentHtml, /fetch\('\/api\/turnstile-config'/);
  assert.match(documentHtml, /script\.src = 'https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit';/);
  assert.match(documentHtml, /action: 'lead_form'/);
  assert.match(documentHtml, /turnstileToken,/);
  assert.match(documentHtml, /const turnstileObserver = new IntersectionObserver/);
  assert.match(documentHtml, /rootMargin: '600px 0px'/);
  assert.doesNotMatch(documentHtml, /<script[^>]+src="https:\/\/challenges\.cloudflare\.com\/turnstile/);
});

test('page uses lightweight Hoàng Long icons for browser tabs and saved-page icons', async () => {
  assert.match(html, /<link rel="icon" type="image\/png" sizes="64x64" href="favicon\.png">/);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon\.png">/);

  const favicon = await stat(new URL('../favicon.png', import.meta.url));
  const touchIcon = await stat(new URL('../apple-touch-icon.png', import.meta.url));
  assert.ok(favicon.size > 0 && favicon.size < 10_000);
  assert.ok(touchIcon.size > 0 && touchIcon.size < 20_000);
});

test('hero critical path keeps the sharp responsive WebP assets alongside critical font preloads', async () => {
  assert.match(html, /href="assets\/images\/hero\/hero-doctor-examination-mobile\.webp"[^>]*type="image\/webp"[^>]*media="\(max-width: 767px\)"[^>]*fetchpriority="high"/);
  assert.match(html, /href="assets\/images\/hero\/hero-doctor-examination\.webp"[^>]*type="image\/webp"[^>]*media="\(min-width: 768px\)"[^>]*fetchpriority="high"/);
  assert.match(html, /<source media="\(max-width: 767px\)" srcset="assets\/images\/hero\/hero-doctor-examination-mobile\.webp" type="image\/webp">/);
  assert.match(html, /class="hero-lcp-image"[\s\S]*?src="assets\/images\/hero\/hero-doctor-examination\.webp"[\s\S]*?width="4104"[\s\S]*?height="2736"/);
  assert.doesNotMatch(html, /hero-doctor-examination-(?:mobile-)?v57\.avif/);
  assert.equal((documentHtml.match(/<link rel="preload"[^>]+as="font"/g) ?? []).length, 6);
  assert.match(html, /logo-hoang-long\.png"[^>]*fetchpriority="low"/);
  assert.match(html, /\.hero-decor-orb \{ display: none !important; \}/);
  assert.match(html, /\.btn-primary \{ animation: ctaAttention 1\.2s ease-in-out infinite !important; \}/);
  assert.doesNotMatch(html, /\.hero-section \.btn-primary,[\s\S]*?animation: none !important;/);
  assert.match(documentHtml, /class="hero-lcp-image"[\s\S]*?loading="eager"[\s\S]*?fetchpriority="high"[\s\S]*?decoding="sync"/);
  assert.doesNotMatch(documentHtml, /class="hero-shell[^\"]*backdrop-blur/);
  assert.match(documentHtml, /data-target="250000" data-duration="1400"/);
  assert.match(documentHtml, /data-target="13" data-duration="800"/);
  assert.match(documentHtml, /data-target="100" data-duration="1100"/);

  const mobileHero = await stat(new URL('../assets/images/hero/hero-doctor-examination-mobile.webp', import.meta.url));
  const desktopHero = await stat(new URL('../assets/images/hero/hero-doctor-examination.webp', import.meta.url));
  assert.ok(mobileHero.size > 45_000 && mobileHero.size < 60_000);
  assert.ok(desktopHero.size > 130_000 && desktopHero.size < 170_000);
});

test('below-fold measurements and timers stay out of the initial main-thread path', () => {
  assert.match(documentHtml, /const reviewClampObserver = new IntersectionObserver/);
  assert.match(documentHtml, /reviewClampObserver\.observe\(reviewSection\)/);
  assert.match(documentHtml, /let sliderTimer = null;/);
  assert.match(documentHtml, /if \(!sliderIsVisible \|\| document\.hidden \|\| sliderTimer\) return;/);
  assert.match(documentHtml, /const doctorStatusObserver = new IntersectionObserver/);
  assert.doesNotMatch(documentHtml, /let sliderTimer = window\.setInterval/);
});

test('mobile difference heading stays intact and Dr Kinh shows his experience', () => {
  assert.match(
    html,
    /<span class="difference-title-clinic text-medical">Phòng khám Đa khoa Hoàng Long<\/span>/,
  );
  assert.match(
    html,
    /\.difference-title-clinic\s*\{[^}]*white-space:\s*nowrap;[^}]*font-size:\s*clamp\(16\.5px,\s*5\.2vw,\s*20\.5px\)\s*!important;/s,
  );

  const kinhStart = html.indexOf('NGUYỄN BÁ KINH');
  const kinhEnd = html.indexOf('<!-- Bác sĩ 5 -->', kinhStart);
  const kinhCard = html.slice(kinhStart, kinhEnd);

  assert.ok(kinhStart > -1 && kinhEnd > kinhStart);
  assert.match(kinhCard, /doctor-experience__years">Hơn 30 năm<\/strong><span>kinh nghiệm trong lĩnh vực Tiêu hóa - Gan mật\./);
});

test('all appointment and consultation CTAs target the registration card', () => {
  const registrationLinks = html.match(/<a\b[^>]*href="#registration-form"[^>]*>/g) ?? [];

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

test('appointment CTAs use one first-click-safe scroll handler on desktop and mobile', () => {
  const handlerStart = html.indexOf("const registrationTarget = document.getElementById('registration-form')");
  const handlerEnd = html.indexOf('// Ảnh nền trang trí ngoài website', handlerStart);
  const handler = html.slice(handlerStart, handlerEnd);

  assert.ok(handlerStart > -1 && handlerEnd > handlerStart);
  assert.match(handler, /closest\('a\[href="#registration-form"\]'\)/);
  assert.match(handler, /event\.preventDefault\(\)/);
  assert.match(handler, /mobileNav\?\.classList\.remove\('is-open'\)/);
  assert.match(handler, /sectionsBeforeRegistration\.forEach\(section => \{/);
  assert.match(handler, /section\.classList\.add\('anchor-layout-ready'\)/);
  assert.match(handler, /registrationTarget\.getBoundingClientRect\(\);/);
  assert.match(handler, /await document\.fonts\.ready;/);
  assert.match(handler, /window\.requestAnimationFrame\(\(\) => \{\s*window\.requestAnimationFrame\(resolve\);/s);
  assert.match(handler, /await stabilizeRegistrationLayout\(\);/);
  assert.match(handler, /registrationScrollPending/);
  assert.match(handler, /registrationTarget\.scrollIntoView\(\{\s*behavior: scrollBehavior,\s*block: 'start'/s);
  assert.equal((handler.match(/scrollIntoView\(/g) ?? []).length, 1);
  assert.doesNotMatch(handler, /setTimeout|850|getRegistrationScrollTop|window\.scrollTo/);
  assert.match(
    stylesheet,
    /section\[id\]\.anchor-layout-ready\s*\{[^}]*content-visibility:\s*visible\s*!important;[^}]*contain-intrinsic-size:\s*none\s*!important;/s,
  );
  assert.match(
    stylesheet,
    /section\[id\]:not\(#home\):not\(\.anchor-layout-ready\), footer\s*\{[^}]*content-visibility:\s*auto;/s,
  );
});

test('mobile hero starts a new line at the screening message and keeps the AI phrase together', () => {
  assert.match(
    html,
    /<span class="hero-screening-break">– Tầm soát <span class="hero-mobile-cluster">sớm <span class="hero-ai-break">tích hợp AI<\/span><\/span><\/span>/,
  );
  assert.match(html, /\.hero-screening-break\s*\{[^}]*display:\s*block;[^}]*margin-top:\s*2px;/s);
  assert.match(html, /\.hero-mobile-cluster\s*\{[^}]*display:\s*inline-block;[^}]*white-space:\s*nowrap;/s);
  assert.match(html, /\.hero-mobile-cluster \.hero-ai-break\s*\{[^}]*display:\s*inline;/s);
});

test('V68 visual and mobile interaction refinements remain present', async () => {
  assert.match(documentHtml, /Niềm tin qua từng lượt thăm khám/);
  assert.match(documentHtml, /<small>Khám ngay hôm nay<\/small>/);
  assert.match(documentHtml, /Về chuyên môn của chúng tôi/);
  assert.match(documentHtml, /class="doctor-intro-follow">đồng hành thăm khám chuyên sâu và toàn diện/);
  assert.equal((documentHtml.match(/class="doctor-experience__years"/g) ?? []).length, 10);
  assert.doesNotMatch(stylesheet, /details\[open\] summary ~ \*\s*\{[^}]*animation:/s);
  assert.doesNotMatch(stylesheet, /@keyframes\s+sweep/);
  assert.doesNotMatch(stylesheet, /\.hero-section \.btn-primary,\s*\.registration-card \.btn-primary\s*\{\s*animation:\s*none/s);
  assert.match(stylesheet, /\[uk-slider\] \.uk-slider-items\s*\{[^}]*touch-action:\s*pan-y pinch-zoom;/s);
  assert.match(documentHtml, /clinicTouchAxis = Math\.abs\(deltaX\) > Math\.abs\(deltaY\) \? 'horizontal' : 'vertical'/);
  assert.doesNotMatch(documentHtml, /#trang-thiet-bi \.uk-slider-items > li, #chuyen-gia/);

  for (let index = 1; index <= 16; index += 1) {
    const imagePath = new URL(`../assets/images/clinic/pk${index}.webp`, import.meta.url);
    const imageStat = await stat(imagePath);
    assert.ok(imageStat.size > 30_000, `pk${index}.webp must use the sharper source asset`);
  }
  assert.equal((documentHtml.match(/width="1920" height="1280"/g) ?? []).length >= 18, true);
  assert.doesNotMatch(documentHtml, /md:hover:scale-\[1\.02\]/);
});

test('MRI and CT use two large technology showcases with real-room proof images', () => {
  const sectionStart = documentHtml.indexOf('<div id="mri-ct"');
  const sectionEnd = documentHtml.indexOf('<!-- HỆ THỐNG DÂY SOI -->', sectionStart);
  const section = documentHtml.slice(sectionStart, sectionEnd);

  assert.equal((section.match(/class="diagnostic-system-card /g) ?? []).length, 2);
  assert.equal((section.match(/class="diagnostic-system-card__visual"/g) ?? []).length, 2);
  assert.equal((section.match(/class="diagnostic-room-proof"/g) ?? []).length, 2);
  assert.equal((section.match(/class="diagnostic-benefit"/g) ?? []).length, 3);
  assert.equal((section.match(/class="diagnostic-room-proof__zoom"/g) ?? []).length, 2);
  assert.match(section, /class="diagnostic-showcase-grid" uk-lightbox="animation: slide"/);
  assert.match(section, /href="assets\/images\/clinic\/pk11\.webp"[^>]*aria-label="Phóng to ảnh phòng MRI thực tế"/);
  assert.match(section, /href="assets\/images\/clinic\/pk12\.webp"[^>]*aria-label="Phóng to ảnh phòng CT thực tế"/);
  assert.match(documentHtml, /const lightboxGroups = Array\.from\(document\.querySelectorAll\('\[uk-lightbox\]'\)\)/);
  assert.match(documentHtml, /activeGalleryLinks = links;/);
  assert.match(documentHtml, /lightboxCounter\.textContent = `\$\{activeGalleryIndex \+ 1\} \/ \$\{activeGalleryLinks\.length\}`;/);
  assert.match(section, /class="diagnostic-intro-follow">hỗ trợ bác sĩ đánh giá chính xác hơn/);
  assert.match(section, /Phát hiện, khoanh vùng chi tiết tổn thương trên toàn bộ hệ tiêu hóa\./);
  assert.match(section, /Tầm soát chính xác các bệnh lý ở ổ bụng mà dây soi mềm không tiếp cận được\./);
  assert.match(section, /Kết quả đồng bộ, giúp chuyên gia phân tích và thiết kế phác đồ điều trị phù hợp\./);
  assert.match(stylesheet, /\.diagnostic-benefit-strip\s*\{[^}]*max-width:\s*1040px;[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(stylesheet, /\.diagnostic-intro-follow\s*\{[^}]*display:\s*block;/s);
  assert.match(stylesheet, /\.mri-title-main\s*\{[^}]*font-size:\s*clamp\(34px, 3\.15vw, 44px\);/s);
  assert.match(stylesheet, /\.diagnostic-showcase-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(stylesheet, /\.diagnostic-system-card__visual\s*\{[^}]*aspect-ratio:\s*16 \/ 9;/s);
  assert.match(stylesheet, /\.diagnostic-system-card__body\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(142px, \.42fr\);/s);
  assert.match(stylesheet, /@media \(max-width: 1023px\)[\s\S]*?\.diagnostic-showcase-grid\s*\{\s*grid-template-columns:\s*1fr;/s);
  assert.doesNotMatch(section, /mri-gallery-item|mri-ct-visual-grid/);
  assert.match(html, /src="assets\/images\/clinic\/mri-system\.webp"/);
  assert.match(html, /src="assets\/images\/clinic\/ct-system\.webp"/);
  assert.match(html, /src="assets\/images\/clinic\/pk11\.webp"[^>]*alt="Phòng chụp cộng hưởng từ MRI thực tế/);
  assert.match(html, /src="assets\/images\/clinic\/pk12\.webp"[^>]*alt="Phòng chụp cắt lớp vi tính CT thực tế/);
  assert.match(html, />FUJIFILM ECHELON SMART 1\.5T<\/h3>/);
  assert.match(html, />FUJIFILM SUPRIA 32<\/h3>/);
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
  assert.match(html, /doctor-experience__years">Gần 50 năm<\/strong><span>kinh nghiệm trong lĩnh vực Ngoại tiêu hóa\./);
  assert.match(html, /Phó Chủ tịch · Hội Khoa học Tiêu hóa Việt Nam/);
  assert.match(html, /Giám đốc chuyên môn - Phòng khám Đa khoa Hoàng Long CS1/);
  assert.match(html, /Giám đốc chuyên môn - Phòng khám Đa khoa Hoàng Long CS2/);
  assert.match(html, /Nguyên Giám đốc Bệnh viện<br>Đại học Y Hà Nội/);
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
  assert.match(html, /doctor-experience__years">Hơn 6 năm<\/strong><span>công tác tại Phòng khám Đa khoa Hoàng Long\./);
  assert.match(html, /doctor-experience__years">Hơn 5 năm<\/strong><span>công tác tại Phòng khám Đa khoa Hoàng Long\./);
  assert.match(html, /doctor-experience__years">Hơn 10 năm<\/strong><span>công tác tại Phòng khám Đa khoa Hoàng Long\./);
  assert.equal((html.match(/doctor-experience__years">Hơn 4 năm<\/strong><span>công tác tại Phòng khám Đa khoa Hoàng Long\./g) ?? []).length, 2);
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

test('approved doctor typography keeps Dr Long credential break and Dr Nang name on one line', () => {
  assert.match(html, /<p class="doctor-credential">Nguyên Giám đốc Bệnh viện<br>Đại học Y Hà Nội<\/p>/);
  assert.match(html, /class="doctor-name--single-line[^"]*">DƯƠNG THỊ PHƯƠNG NĂNG<\/span>/);
  assert.match(html, /\.doctor-name--single-line\s*\{[^}]*white-space:\s*nowrap;[^}]*font-size:\s*16px\s*!important;/s);
  assert.match(html, /@media \(min-width:\s*768px\)\s*\{\s*\.doctor-name--single-line\s*\{[^}]*font-size:\s*19px\s*!important;/s);
  assert.match(html, /@media \(min-width:\s*1024px\) and \(max-width:\s*1199px\)\s*\{\s*\.doctor-name--single-line\s*\{[^}]*transform:\s*scaleX\(\.86\);/s);
});

test('mobile consultation fields use restrained corners', () => {
  assert.match(
    stylesheet,
    /@media \(max-width:\s*767px\)\s*\{[\s\S]*?\.form-input\s*\{[^}]*border-radius:\s*6px\s*!important;/,
  );
});

test('lead form uses the 34 post-merger provinces and a native appointment calendar', () => {
  const formStart = documentHtml.indexOf('<form id="lead-form"');
  const formEnd = documentHtml.indexOf('</form>', formStart);
  const form = documentHtml.slice(formStart, formEnd);
  const provinceSelect = form.match(/<select[^>]*name="provinceCity"[^>]*>([\s\S]*?)<\/select>/)?.[1] ?? '';
  const provinceValues = [...provinceSelect.matchAll(/<option value="([^"]+)">/g)].map(match => match[1]);
  const expectedProvinceValues = [
    'ha-noi', 'an-giang', 'bac-ninh', 'ca-mau', 'can-tho', 'cao-bang', 'da-nang',
    'dak-lak', 'dien-bien', 'dong-nai', 'dong-thap', 'gia-lai', 'ha-tinh', 'hai-phong',
    'ho-chi-minh', 'hue', 'hung-yen', 'khanh-hoa', 'lai-chau', 'lam-dong', 'lang-son',
    'lao-cai', 'nghe-an', 'ninh-binh', 'phu-tho', 'quang-ngai', 'quang-ninh', 'quang-tri',
    'son-la', 'tay-ninh', 'thai-nguyen', 'thanh-hoa', 'tuyen-quang', 'vinh-long',
  ];

  assert.ok(formStart > -1 && formEnd > formStart);
  assert.match(form, /name="provinceCity" required/);
  assert.deepEqual(provinceValues, expectedProvinceValues);
  assert.match(form, /value="ho-chi-minh">Thành phố Hồ Chí Minh</);
  assert.match(form, /value="hue">Huế</);
  assert.match(form, /type="date" name="appointmentDate" required/);
  assert.match(documentHtml, /appointmentDateInput\.min = formatLocalDate\(today\)/);
  assert.match(documentHtml, /appointmentDateInput\.max = formatLocalDate\(latestAppointmentDate\)/);
  assert.match(documentHtml, /provinceCity: formData\.get\('provinceCity'\)/);
  assert.match(documentHtml, /appointmentDate: formData\.get\('appointmentDate'\)/);
  assert.match(stylesheet, /\.lead-select-field > label\s*\{[^}]*font-size:\s*13px;/s);
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

test('trust metrics count on mobile with a shorter low-frequency animation', () => {
  assert.match(html, /class="counter" data-target="250000" data-duration="1400" data-mobile-duration="750">250\.000<\/span>/);
  assert.match(html, /class="counter" data-target="13" data-duration="800" data-mobile-duration="550">13<\/span>\+/);
  assert.match(html, /class="counter" data-target="100" data-duration="1100" data-mobile-duration="650">100<\/span>\+/);
  assert.match(html, /const isMobileCounterMode = window\.matchMedia\('\(max-width: 767px\)'\)\.matches;/);
  assert.match(html, /const shouldAnimateCounters = !prefersReducedMotion;/);
  assert.match(html, /if \(!shouldAnimateCounters\) \{\s*counters\.forEach\(renderCounterTarget\);/s);
  assert.match(html, /else \{\s*counters\.forEach\(\(counter\) => \{\s*counter\.textContent = '0';/s);
  assert.match(html, /const duration = isMobileCounterMode \? mobileDuration : desktopDuration;/);
  assert.match(html, /const frameInterval = 1000 \/ \(isMobileCounterMode \? 20 : 30\);/);
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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [documentHtml, apiCode, appsScriptCode] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../api/lead.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../integrations/google-apps-script.gs', import.meta.url), 'utf8'),
]);

const officialProvinceCities = [
  'Hà Nội',
  'An Giang',
  'Bắc Ninh',
  'Cà Mau',
  'Cần Thơ',
  'Cao Bằng',
  'Đà Nẵng',
  'Đắk Lắk',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Tĩnh',
  'Hải Phòng',
  'Thành phố Hồ Chí Minh',
  'Huế',
  'Hưng Yên',
  'Khánh Hòa',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Nghệ An',
  'Ninh Bình',
  'Phú Thọ',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sơn La',
  'Tây Ninh',
  'Thái Nguyên',
  'Thanh Hóa',
  'Tuyên Quang',
  'Vĩnh Long',
];

test('the same official 34-province list is enforced in form, API and Apps Script', () => {
  const formOptions = documentHtml
    .match(/<select[^>]*name="provinceCity"[^>]*>([\s\S]*?)<\/select>/)?.[1]
    .matchAll(/<option value="[^"]+">([^<]+)<\/option>/g);
  const formLabels = [...(formOptions ?? [])].map(match => match[1]);

  const apiMapSource = apiCode.match(/const PROVINCE_CITY_OPTIONS = new Map\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
  const apiLabels = [...apiMapSource.matchAll(/\['[^']+', '([^']+)'\]/g)].map(match => match[1]);

  const appsListSource = appsScriptCode.match(/const PROVINCE_CITIES = \[([\s\S]*?)\];/)?.[1] ?? '';
  const appsLabels = [...appsListSource.matchAll(/'([^']+)'/g)].map(match => match[1]);

  assert.equal(new Set(officialProvinceCities).size, 34);
  assert.deepEqual(formLabels, officialProvinceCities);
  assert.deepEqual(apiLabels, officialProvinceCities);
  assert.deepEqual(appsLabels, officialProvinceCities);
});

test('the browser and both server layers share the same 366-day appointment window', () => {
  assert.match(documentHtml, /latestAppointmentDate\.setDate\(latestAppointmentDate\.getDate\(\) \+ 366\)/);
  assert.match(apiCode, /const APPOINTMENT_WINDOW_DAYS = 366;/);
  assert.match(appsScriptCode, /const APPOINTMENT_WINDOW_DAYS = 366;/);
});

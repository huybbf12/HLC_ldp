/**
 * Webhook nhận lead từ Vercel, lưu vào Google Sheet và gửi email thông báo.
 *
 * Thiết lập bắt buộc:
 * Apps Script > Project Settings > Script Properties
 * Tạo LEAD_WEBHOOK_SECRET trùng với biến trên Vercel.
 */

const SPREADSHEET_ID = '1KgKKoN4qwxw4qmRHp6wMxUY0ZxNgkCUoVQYwOfwAPug';
const SHEET_NAME = 'Lead Landing Page';
const NOTIFICATION_EMAIL = 'hoanglongclinic.news@gmail.com';
const REFERENCE_PREFIX = 'HLC-NS';
const REFERENCE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const HEADERS = [
  'Mã tham chiếu',
  'Mã hệ thống',
  'Thời gian',
  'Họ và tên',
  'Số điện thoại',
  'Dịch vụ quan tâm',
  'Ghi chú',
  'Nguồn trang',
  'Referrer',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'Trạng thái',
  'Thông báo email',
];

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function safeCell_(value, maxLength) {
  var text = cleanText_(value, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function styleHeader_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setBackground('#084c7a')
    .setFontColor('#ffffff');
}

function backfillReferenceCodes_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var rowCount = lastRow - 1;
  var rows = sheet.getRange(2, 1, rowCount, 3).getValues();
  var maxSequenceByDate = {};
  var referencePattern = new RegExp('^' + REFERENCE_PREFIX + '-(\\d{8})-(\\d+)$');
  var changed = false;

  rows.forEach(function(row) {
    var match = cleanText_(row[0], 80).match(referencePattern);
    if (!match) return;

    var dateKey = match[1];
    var sequence = Number(match[2]) || 0;
    maxSequenceByDate[dateKey] = Math.max(maxSequenceByDate[dateKey] || 0, sequence);
  });

  rows.forEach(function(row) {
    if (cleanText_(row[0], 80)) return;

    var submittedAt = new Date(row[2]);
    if (isNaN(submittedAt.getTime())) return;

    var dateKey = Utilities.formatDate(submittedAt, REFERENCE_TIME_ZONE, 'yyyyMMdd');
    var nextSequence = (maxSequenceByDate[dateKey] || 0) + 1;
    maxSequenceByDate[dateKey] = nextSequence;
    row[0] = REFERENCE_PREFIX + '-' + dateKey + '-' + String(nextSequence).padStart(3, '0');
    changed = true;
  });

  if (changed) {
    sheet.getRange(2, 1, rowCount, 1).setValues(rows.map(function(row) {
      return [row[0]];
    }));
  }

  var properties = PropertiesService.getScriptProperties();
  Object.keys(maxSequenceByDate).forEach(function(dateKey) {
    var propertyKey = 'LEAD_SEQUENCE_' + dateKey;
    var storedSequence = Number(properties.getProperty(propertyKey)) || 0;
    if (maxSequenceByDate[dateKey] > storedSequence) {
      properties.setProperty(propertyKey, String(maxSequenceByDate[dateKey]));
    }
  });
}

function getOrCreateSheet_() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    styleHeader_(sheet);
    sheet.autoResizeColumns(1, HEADERS.length);
  } else {
    var firstHeader = cleanText_(sheet.getRange(1, 1).getValue(), 100);
    var secondHeader = cleanText_(sheet.getRange(1, 2).getValue(), 100);

    // Tự nâng cấp tab do phiên bản cũ tạo: chèn mã tham chiếu nhưng giữ nguyên toàn bộ lead.
    if (firstHeader === 'Mã lead') {
      sheet.insertColumnBefore(1);
      sheet.getRange(1, 1).setValue('Mã tham chiếu');
      sheet.getRange(1, 2).setValue('Mã hệ thống');
    } else if (firstHeader === 'Mã tham chiếu' && secondHeader === 'Mã lead') {
      sheet.getRange(1, 2).setValue('Mã hệ thống');
    }

    styleHeader_(sheet);
  }

  backfillReferenceCodes_(sheet);
  return sheet;
}

function findLeadRow_(sheet, leadId) {
  if (!leadId || sheet.getLastRow() < 2) return null;

  var match = sheet
    .getRange(2, 2, sheet.getLastRow() - 1, 1)
    .createTextFinder(leadId)
    .matchEntireCell(true)
    .findNext();

  return match ? match.getRow() : null;
}

function sendLeadEmail_(lead) {
  var service = lead.service || 'Chưa chọn';
  var note = lead.note || 'Không có';
  var subject = '[' + lead.referenceCode + '] Lead nội soi – ' + lead.name + ' – ' + lead.phone;
  var htmlBody = [
    '<div style="font-family:Arial,sans-serif;max-width:640px;color:#17324d">',
    '<h2 style="color:#084c7a">Có đăng ký tư vấn mới từ landing page</h2>',
    '<p style="display:inline-block;margin:0 0 14px;padding:8px 12px;border-radius:8px;background:#e8f4fb;color:#084c7a;font-size:16px;font-weight:bold">Mã tham chiếu: ' + escapeHtml_(lead.referenceCode) + '</p>',
    '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">',
    '<tr><td style="font-weight:bold;border-bottom:1px solid #e5e7eb">Mã hệ thống</td><td style="border-bottom:1px solid #e5e7eb">' + escapeHtml_(lead.leadId) + '</td></tr>',
    '<tr><td style="font-weight:bold;border-bottom:1px solid #e5e7eb">Họ và tên</td><td style="border-bottom:1px solid #e5e7eb">' + escapeHtml_(lead.name) + '</td></tr>',
    '<tr><td style="font-weight:bold;border-bottom:1px solid #e5e7eb">Số điện thoại</td><td style="border-bottom:1px solid #e5e7eb"><a href="tel:' + escapeHtml_(lead.phone) + '">' + escapeHtml_(lead.phone) + '</a></td></tr>',
    '<tr><td style="font-weight:bold;border-bottom:1px solid #e5e7eb">Dịch vụ</td><td style="border-bottom:1px solid #e5e7eb">' + escapeHtml_(service) + '</td></tr>',
    '<tr><td style="font-weight:bold;border-bottom:1px solid #e5e7eb">Ghi chú</td><td style="border-bottom:1px solid #e5e7eb">' + escapeHtml_(note) + '</td></tr>',
    '<tr><td style="font-weight:bold;border-bottom:1px solid #e5e7eb">Nguồn trang</td><td style="border-bottom:1px solid #e5e7eb">' + escapeHtml_(lead.sourceUrl || 'Không xác định') + '</td></tr>',
    '</table>',
    '<p style="font-size:12px;color:#64748b">Lead cũng đã được lưu tại tab “' + escapeHtml_(SHEET_NAME) + '” trong Google Sheet.</p>',
    '</div>',
  ].join('');

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    htmlBody: htmlBody,
    body: [
      'Có đăng ký tư vấn mới từ landing page',
      'Mã tham chiếu: ' + lead.referenceCode,
      'Mã hệ thống: ' + lead.leadId,
      'Họ và tên: ' + lead.name,
      'Số điện thoại: ' + lead.phone,
      'Dịch vụ: ' + service,
      'Ghi chú: ' + note,
      'Nguồn: ' + (lead.sourceUrl || 'Không xác định'),
    ].join('\n'),
    name: 'Hoàng Long Clinic',
  });
}

function createReferenceCode_(sheet, submittedAt) {
  var dateKey = Utilities.formatDate(submittedAt, REFERENCE_TIME_ZONE, 'yyyyMMdd');
  var propertyKey = 'LEAD_SEQUENCE_' + dateKey;
  var properties = PropertiesService.getScriptProperties();
  var maxSequence = Number(properties.getProperty(propertyKey)) || 0;

  if (sheet.getLastRow() >= 2) {
    var prefix = REFERENCE_PREFIX + '-' + dateKey + '-';
    var references = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();

    references.forEach(function(row) {
      var referenceCode = cleanText_(row[0], 80);
      if (referenceCode.indexOf(prefix) !== 0) return;

      var sequence = Number(referenceCode.slice(prefix.length)) || 0;
      maxSequence = Math.max(maxSequence, sequence);
    });
  }

  var nextSequence = maxSequence + 1;
  properties.setProperty(propertyKey, String(nextSequence));
  return REFERENCE_PREFIX + '-' + dateKey + '-' + String(nextSequence).padStart(3, '0');
}

function doGet() {
  return jsonResponse_({ ok: true, service: 'Hoang Long lead webhook' });
}

function doPost(event) {
  var expectedSecret = PropertiesService.getScriptProperties().getProperty('LEAD_WEBHOOK_SECRET');
  if (!expectedSecret) {
    return jsonResponse_({ ok: false, error: 'Webhook chưa được cấu hình.' });
  }

  var lead;
  try {
    lead = JSON.parse(event && event.postData ? event.postData.contents : '{}');
  } catch (error) {
    return jsonResponse_({ ok: false, error: 'JSON không hợp lệ.' });
  }

  if (!lead || cleanText_(lead.secret, 200) !== expectedSecret) {
    return jsonResponse_({ ok: false, error: 'Không được phép.' });
  }

  lead.leadId = cleanText_(lead.leadId, 100);
  lead.name = cleanText_(lead.name, 100);
  lead.phone = cleanText_(lead.phone, 30);
  lead.service = cleanText_(lead.service, 120);
  lead.note = cleanText_(lead.note, 500);
  lead.sourceUrl = cleanText_(lead.sourceUrl, 500);
  lead.referrer = cleanText_(lead.referrer, 500);
  lead.utmSource = cleanText_(lead.utmSource, 120);
  lead.utmMedium = cleanText_(lead.utmMedium, 120);
  lead.utmCampaign = cleanText_(lead.utmCampaign, 160);

  if (!lead.leadId || lead.name.length < 2 || !/^0(?:3|5|7|8|9)\d{8}$/.test(lead.phone) || lead.consent !== true) {
    return jsonResponse_({ ok: false, error: 'Dữ liệu lead không hợp lệ.' });
  }

  var lock = LockService.getScriptLock();
  var sheet;
  var rowNumber;
  try {
    lock.waitLock(10000);
    sheet = getOrCreateSheet_();

    var existingRow = findLeadRow_(sheet, lead.leadId);
    if (existingRow) {
      return jsonResponse_({
        ok: true,
        leadId: lead.leadId,
        referenceCode: cleanText_(sheet.getRange(existingRow, 1).getValue(), 80),
        duplicate: true,
      });
    }

    var submittedAt = new Date(lead.submittedAt);
    if (isNaN(submittedAt.getTime())) submittedAt = new Date();
    lead.referenceCode = createReferenceCode_(sheet, submittedAt);

    sheet.appendRow([
      safeCell_(lead.referenceCode, 80),
      safeCell_(lead.leadId, 100),
      submittedAt,
      safeCell_(lead.name, 100),
      safeCell_(lead.phone, 30),
      safeCell_(lead.service, 120),
      safeCell_(lead.note, 500),
      safeCell_(lead.sourceUrl, 500),
      safeCell_(lead.referrer, 500),
      safeCell_(lead.utmSource, 120),
      safeCell_(lead.utmMedium, 120),
      safeCell_(lead.utmCampaign, 160),
      'Chưa liên hệ',
      'Đang gửi',
    ]);
    rowNumber = sheet.getLastRow();
  } catch (error) {
    return jsonResponse_({ ok: false, error: 'Không thể lưu lead.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }

  var emailSent = true;
  try {
    sendLeadEmail_(lead);
    sheet.getRange(rowNumber, 14).setValue('Đã gửi');
  } catch (error) {
    emailSent = false;
    sheet.getRange(rowNumber, 14).setValue('Lỗi gửi – kiểm tra quota/quyền Gmail');
  }

  return jsonResponse_({
    ok: true,
    leadId: lead.leadId,
    referenceCode: lead.referenceCode,
    emailSent: emailSent,
  });
}

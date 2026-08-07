import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const appsScriptCode = fs.readFileSync(
  new URL('../integrations/google-apps-script.gs', import.meta.url),
  'utf8',
);

const OLD_HEADERS = [
  'Mã lead',
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

function createHarness() {
  const data = [
    [...OLD_HEADERS],
    [
      'uuid-old-1',
      new Date('2026-07-24T01:00:00.000Z'),
      'Khách cũ 1',
      '0912345678',
      'Nội soi',
      '',
      'https://example.com',
      '',
      'facebook',
      'paid',
      'campaign',
      'Chưa liên hệ',
      'Đã gửi',
    ],
    [
      'uuid-old-2',
      new Date('2026-07-24T02:00:00.000Z'),
      'Khách cũ 2',
      '0987654321',
      'Nội soi',
      '',
      'https://example.com',
      '',
      'google',
      'cpc',
      'campaign',
      'Chưa liên hệ',
      'Đã gửi',
    ],
  ];
  const properties = new Map([['LEAD_WEBHOOK_SECRET', 'test-secret']]);
  const sentEmails = [];
  const metrics = { getRangeCalls: 0 };

  function ensureCell(row, column) {
    while (data.length < row) data.push([]);
    while (data[row - 1].length < column) data[row - 1].push('');
  }

  class Range {
    constructor(row, column, rowCount = 1, columnCount = 1) {
      this.row = row;
      this.column = column;
      this.rowCount = rowCount;
      this.columnCount = columnCount;
    }

    getValue() {
      ensureCell(this.row, this.column);
      return data[this.row - 1][this.column - 1];
    }

    setValue(value) {
      ensureCell(this.row, this.column);
      data[this.row - 1][this.column - 1] = value;
      return this;
    }

    getValues() {
      const values = [];
      for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
        const row = [];
        for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
          ensureCell(this.row + rowOffset, this.column + columnOffset);
          row.push(data[this.row + rowOffset - 1][this.column + columnOffset - 1]);
        }
        values.push(row);
      }
      return values;
    }

    getDisplayValues() {
      return this.getValues().map(row => row.map(value => String(value ?? '')));
    }

    setValues(values) {
      values.forEach((row, rowOffset) => {
        row.forEach((value, columnOffset) => {
          ensureCell(this.row + rowOffset, this.column + columnOffset);
          data[this.row + rowOffset - 1][this.column + columnOffset - 1] = value;
        });
      });
      return this;
    }

    setFontWeight() { return this; }
    setBackground() { return this; }
    setFontColor() { return this; }

    createTextFinder(needle) {
      const range = this;
      return {
        matchEntireCell() { return this; },
        findNext() {
          for (let rowOffset = 0; rowOffset < range.rowCount; rowOffset += 1) {
            const value = data[range.row + rowOffset - 1][range.column - 1];
            if (String(value) === String(needle)) {
              const matchedRow = range.row + rowOffset;
              return { getRow: () => matchedRow };
            }
          }
          return null;
        },
      };
    }
  }

  const sheet = {
    getLastRow: () => data.length,
    getRange(row, column, rowCount = 1, columnCount = 1) {
      metrics.getRangeCalls += 1;
      return new Range(row, column, rowCount, columnCount);
    },
    insertColumnBefore(position) {
      data.forEach(row => row.splice(position - 1, 0, ''));
    },
    appendRow(row) {
      data.push([...row]);
    },
    setFrozenRows() {},
    autoResizeColumns() {},
  };

  const scriptProperties = {
    getProperty: key => properties.get(key) ?? null,
    setProperty(key, value) {
      properties.set(key, value);
      return scriptProperties;
    },
  };

  const lock = {
    locked: false,
    waitLock() { this.locked = true; },
    hasLock() { return this.locked; },
    releaseLock() { this.locked = false; },
  };

  const formatDate = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const getPart = type => parts.find(part => part.type === type).value;
    return `${getPart('year')}${getPart('month')}${getPart('day')}`;
  };

  const context = vm.createContext({
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: () => sheet,
        insertSheet: () => sheet,
      }),
    },
    PropertiesService: {
      getScriptProperties: () => scriptProperties,
    },
    LockService: {
      getScriptLock: () => lock,
    },
    Utilities: { formatDate },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return {
          text,
          setMimeType() { return this; },
        };
      },
    },
    MailApp: {
      sendEmail: options => sentEmails.push(options),
    },
    Intl,
    Date,
    JSON,
    String,
    Number,
    Object,
    RegExp,
    Math,
    isNaN,
  });

  vm.runInContext(appsScriptCode, context);
  return { context, data, properties, sentEmails, metrics };
}

test('existing Sheet is migrated without losing old lead data', () => {
  const { context, data, properties, metrics } = createHarness();
  vm.runInContext('getOrCreateSheet_()', context);
  const callsAfterMigration = metrics.getRangeCalls;

  assert.equal(data[0][0], 'Mã tham chiếu');
  assert.equal(data[0][1], 'Mã hệ thống');
  assert.equal(data[1][0], 'HLC-NS-20260724-001');
  assert.equal(data[2][0], 'HLC-NS-20260724-002');
  assert.equal(data[1][1], 'uuid-old-1');
  assert.equal(data[1][3], 'Khách cũ 1');
  assert.equal(properties.get('LEAD_SEQUENCE_20260724'), '2');
  assert.equal(properties.get('LEAD_SCHEMA_VERSION'), '2');

  vm.runInContext('getOrCreateSheet_()', context);
  assert.equal(metrics.getRangeCalls, callsAfterMigration);
});

test('new lead receives the next reference code in Sheet and email', () => {
  const { context, data, sentEmails } = createHarness();
  const lead = {
    secret: 'test-secret',
    leadId: 'uuid-new-3',
    submittedAt: '2026-07-24T03:00:00.000Z',
    name: 'Nguyễn Văn An',
    phone: '0911111111',
    service: 'Nội soi',
    note: '',
    sourceUrl: 'https://example.com',
    referrer: '',
    utmSource: 'facebook',
    utmMedium: 'paid',
    utmCampaign: 'campaign',
    consent: true,
  };
  context.__event = { postData: { contents: JSON.stringify(lead) } };

  const response = vm.runInContext('doPost(__event)', context);
  const result = JSON.parse(response.text);
  const newestRow = data.at(-1);

  assert.equal(result.ok, true);
  assert.equal(result.referenceCode, 'HLC-NS-20260724-003');
  assert.equal(newestRow[0], 'HLC-NS-20260724-003');
  assert.equal(newestRow[1], 'uuid-new-3');
  assert.equal(newestRow[13], 'Đã gửi');
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'pkdk.hoanglong10@gmail.com');
  assert.match(sentEmails[0].subject, /HLC-NS-20260724-003/);
});

test('same phone submitted again within 24 hours is suppressed without a second row or email', () => {
  const { context, data, sentEmails } = createHarness();
  const submittedAt = new Date().toISOString();
  const firstLead = {
    secret: 'test-secret',
    leadId: 'uuid-dedupe-first',
    submittedAt,
    name: 'Khách kiểm thử',
    phone: '0933333333',
    service: 'Nội soi',
    note: '',
    sourceUrl: 'https://example.com',
    referrer: '',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'noi-soi',
    consent: true,
  };

  context.__event = { postData: { contents: JSON.stringify(firstLead) } };
  const firstResult = JSON.parse(vm.runInContext('doPost(__event)', context).text);
  const rowsAfterFirst = data.length;
  const emailsAfterFirst = sentEmails.length;

  context.__event = {
    postData: {
      contents: JSON.stringify({
        ...firstLead,
        leadId: 'uuid-dedupe-second',
        name: 'Tên được bot đổi',
      }),
    },
  };
  const secondResult = JSON.parse(vm.runInContext('doPost(__event)', context).text);

  assert.equal(firstResult.ok, true);
  assert.equal(secondResult.ok, true);
  assert.equal(secondResult.duplicate, true);
  assert.equal(secondResult.referenceCode, firstResult.referenceCode);
  assert.equal(data.length, rowsAfterFirst);
  assert.equal(sentEmails.length, emailsAfterFirst);
});

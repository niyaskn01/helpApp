/**
 * Need a Hand? — Google Apps Script backend
 *
 * SETUP
 * 1. Open your Google Sheet > Extensions > Apps Script.
 * 2. Delete everything in Code.gs and paste this whole file.
 * 3. Deploy > Manage deployments > edit (pencil) > Version: "New version" > Deploy.
 *    (IMPORTANT: editing the code is not enough — you must deploy a NEW VERSION.)
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the /exec Web App URL into the Lovable secret GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * This version writes by HEADER NAME, so column order does not matter and any
 * missing columns (Formatted Address, Helpers Needed, When Needed, Scheduled For…)
 * are appended to the header row automatically on the next submission.
 */

var SHEET_NAME = 'Tasks';

var HEADERS = [
  'Task ID', 'Created At', 'Customer Name', 'Contact Number', 'Task Name',
  'Task Description', 'Latitude', 'Longitude', 'Formatted Address', 'Fee',
  'Helpers Needed', 'When Needed', 'Scheduled For', 'Status',
  'Assigned Helper', 'Helper Contact', 'Completed At'
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Missing request body' });
    }

    var data = JSON.parse(e.postData.contents);

    var required = [
      'customerName', 'contactNumber', 'taskName', 'taskDescription',
      'latitude', 'longitude', 'formattedAddress', 'fee',
      'helpersNeeded', 'whenNeeded'
    ];
    for (var i = 0; i < required.length; i++) {
      var key = required[i];
      if (data[key] === undefined || data[key] === null || data[key] === '') {
        return jsonResponse({ success: false, error: 'Missing required field: ' + key });
      }
    }

    if (!/^[6-9]\d{9}$/.test(String(data.contactNumber))) {
      return jsonResponse({ success: false, error: 'Invalid Indian mobile number' });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);

    try {
      var sheet = getSheet();
      var headers = ensureHeaders(sheet);
      var taskId = nextTaskId(sheet);

      var values = {
        'Task ID': taskId,
        'Created At': data.createdAt || new Date().toISOString(),
        'Customer Name': data.customerName,
        'Contact Number': "'" + String(data.contactNumber),
        'Task Name': data.taskName,
        'Task Description': data.taskDescription,
        'Latitude': Number(data.latitude),
        'Longitude': Number(data.longitude),
        'Formatted Address': String(data.formattedAddress),
        'Fee': Number(data.fee),
        'Helpers Needed': Number(data.helpersNeeded),
        'When Needed': String(data.whenNeeded),
        'Scheduled For': data.scheduledFor || '',
        'Status': data.status || 'Looking for a helper',
        'Assigned Helper': '',
        'Helper Contact': '',
        'Completed At': ''
      };

      var row = [];
      for (var c = 0; c < headers.length; c++) {
        var name = String(headers[c]).trim();
        row.push(values.hasOwnProperty(name) ? values[name] : '');
      }

      sheet.appendRow(row);

      return jsonResponse({ success: true, taskId: taskId });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function doGet() {
  try {
    var sheet = getSheet();
    var headers = ensureHeaders(sheet);
    return jsonResponse({
      success: true,
      message: 'Need a Hand? task webhook is live',
      sheet: SHEET_NAME,
      headers: headers
    });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

/** Run this once from the Apps Script editor to create/update all columns. */
function setupSheet() {
  var sheet = getSheet();
  var headers = ensureHeaders(sheet);
  sheet.autoResizeColumns(1, headers.length);
  return headers;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

/** Makes sure every expected header exists; appends any that are missing. */
function ensureHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  var headers = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];

  var changed = false;
  for (var i = 0; i < HEADERS.length; i++) {
    if (headers.indexOf(HEADERS[i]) === -1) {
      headers.push(HEADERS[i]);
      changed = true;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return headers;
}

function nextTaskId(sheet) {
  var rows = sheet.getLastRow();
  var next = rows > 1 ? rows : 1; // row 1 is the header
  return 'TASK-' + ('000000' + next).slice(-6);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
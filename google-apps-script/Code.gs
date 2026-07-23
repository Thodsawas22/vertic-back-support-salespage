const CONFIG = {
  spreadsheetId: "1dJa71bTOoDhq5-dva81EjjhuRMgQFOYzHdYbQJxMpa8",
  sheetName: "Orders",
};

const HEADERS = [
  "Created at",
  "Status",
  "Package",
  "Quantity",
  "Amount",
  "Customer",
  "Phone",
  "Address line",
  "Subdistrict",
  "District",
  "Province",
  "Postcode",
  "Full address",
];

function doGet() {
  return jsonResponse({ ok: true, service: "VERTIC order webhook" });
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const webhookSecret = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("WEBHOOK_SECRET is not configured in Script properties");
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ ok: false, error: "Missing request body" });
    }

    const payload = JSON.parse(event.postData.contents);
    if (payload.secret !== webhookSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const order = payload.order;
    validateOrder(order);

    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    const sheet = spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);
    ensureHeaders(sheet);

    const rowNumber = sheet.getLastRow() + 1;
    const row = [[
      order.createdAt,
      order.orderStatus,
      order.package,
      order.quantity,
      order.amount,
      order.customerName,
      order.phone,
      order.addressLine,
      order.district,
      order.amphoe,
      order.province,
      order.zipcode,
      order.fullAddress,
    ]];

    sheet.getRange(rowNumber, 7).setNumberFormat("@");
    sheet.getRange(rowNumber, 12).setNumberFormat("@");
    sheet.getRange(rowNumber, 1, 1, HEADERS.length).setValues(row);
    sheet.getRange(rowNumber, 4).setNumberFormat("0");
    sheet.getRange(rowNumber, 5).setNumberFormat("#,##0");

    return jsonResponse({ ok: true, row: rowNumber });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function validateOrder(order) {
  const required = ["createdAt", "orderStatus", "package", "quantity", "amount", "customerName", "phone", "addressLine", "district", "amphoe", "province"];
  if (!order) throw new Error("Missing order");

  required.forEach(function (field) {
    if (order[field] === undefined || order[field] === null || order[field] === "") {
      throw new Error("Missing order field: " + field);
    }
  });
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#082d63");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
    return;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (existingHeaders.join("|") !== HEADERS.join("|")) {
    throw new Error("The Orders sheet headers do not match the expected columns");
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
